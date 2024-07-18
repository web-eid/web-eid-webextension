/*
 * Copyright (c) 2020-2024 Estonian Information System Authority
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

import {
  ExtensionFailureResponse,
  ExtensionSignResponse,
} from "@web-eid.js/models/message/ExtensionResponse";

import Action from "@web-eid.js/models/Action";
import { NativeSignRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeSignResponse } from "@web-eid.js/models/message/NativeResponse";
import UnknownError from "@web-eid.js/errors/UnknownError";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";

import { MessageSender } from "../../models/Browser/Runtime";
import NativeAppService from "../services/NativeAppService";
import actionErrorHandler from "../../shared/actionErrorHandler";
import config from "../../config";
import { getSenderUrl } from "../../shared/utils/sender";


export default async function sign(
  certificate: string,
  hash: string,
  hashFunction: string,
  sender: MessageSender,
  libraryVersion: string,
  userInteractionTimeout: number,
  lang?: string,
): Promise<ExtensionSignResponse | ExtensionFailureResponse> {
  let nativeAppService: NativeAppService | undefined;
  let nativeAppStatus: { version: string } | undefined;

  try {
    nativeAppService = new NativeAppService();
    nativeAppStatus  = await nativeAppService.connect();

    config.DEBUG && console.log("Sign: connected to native", nativeAppStatus);

    const message: NativeSignRequest = {
      command: "sign",

      arguments: {
        hash,
        hashFunction,
        certificate,

        origin: (new URL(getSenderUrl(sender))).origin,

        ...(lang ? { lang } : {}),
      },
    };

    const response = await nativeAppService.send<NativeSignResponse>(
      message,
      userInteractionTimeout,
      new UserTimeoutError(),
    );

    const isResponseValid = (
      response?.signature &&
      response?.signatureAlgorithm.hashFunction &&
      response?.signatureAlgorithm.paddingScheme &&
      response?.signatureAlgorithm.cryptoAlgorithm
    );

    if (isResponseValid) {
      return { action: Action.SIGN_SUCCESS, ...response };
    } else {
      throw new UnknownError("unexpected response from native application");
    }
  } catch (error) {
    console.error("Sign:", error);

    return actionErrorHandler(Action.SIGN_FAILURE, error, libraryVersion, nativeAppStatus?.version);
  } finally {
    nativeAppService?.close();
  }
}
