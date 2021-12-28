/*
 * Copyright (c) 2020-2022 Estonian Information System Authority
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import Action from "@web-eid.js/models/Action";
import { NativeGetSigningCertificateRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeGetSigningCertificateResponse } from "@web-eid.js/models/message/NativeResponse";
import UnknownError from "@web-eid.js/errors/UnknownError";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";
import { serializeError } from "@web-eid.js/utils/errorSerializer";

import {
  ExtensionFailureResponse,
  ExtensionGetSigningCertificateResponse,
} from "@web-eid.js/models/message/ExtensionResponse";

import { MessageSender } from "../../models/Browser/Runtime";
import NativeAppService from "../services/NativeAppService";
import config from "../../config";
import { getSenderUrl } from "../../shared/utils/sender";
import { throwAfterTimeout } from "../../shared/utils/timing";

export default async function getSigningCertificate(
  sender: MessageSender,
  userInteractionTimeout: number,
  lang?: string,
): Promise<ExtensionGetSigningCertificateResponse | ExtensionFailureResponse> {
  const nativeAppService = new NativeAppService();

  try {
    const nativeAppStatus = await nativeAppService.connect();

    config.DEBUG && console.log("getSigningCertificate: connected to native", nativeAppStatus);

    const message: NativeGetSigningCertificateRequest = {
      command: "get-signing-certificate",

      arguments: {
        origin: (new URL(getSenderUrl(sender))).origin,

        ...(lang ? { lang } : {}),
      },
    };

    const response = await Promise.race([
      nativeAppService.send<NativeGetSigningCertificateResponse>(message),
      throwAfterTimeout(userInteractionTimeout, new UserTimeoutError()),
    ]);

    const isResponseValid = (
      response?.certificate &&
      response?.supportedSignatureAlgorithms.length
    );

    if (isResponseValid) {
      return { action: Action.GET_SIGNING_CERTIFICATE_SUCCESS, ...response };
    } else {
      throw new UnknownError("unexpected response from native application");
    }
  } catch (error: any) {
    console.error("GetSigningCertificate:", error);

    return {
      action: Action.GET_SIGNING_CERTIFICATE_FAILURE,
      error:  serializeError(error),
    };
  } finally {
    nativeAppService.close();
  }
}
