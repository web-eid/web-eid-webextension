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

import Action from "@web-eid.js/models/Action";
import { NativeAuthenticateRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeAuthenticateResponse } from "@web-eid.js/models/message/NativeResponse";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";

import { ExtensionAuthenticateResponse, ExtensionFailureResponse } from "@web-eid.js/models/message/ExtensionResponse";
import { MessageSender } from "../../models/Browser/Runtime";
import NativeAppService from "../services/NativeAppService";
import UnknownError from "@web-eid.js/errors/UnknownError";
import actionErrorHandler from "../../shared/actionErrorHandler";
import config from "../../config";
import { getSenderUrl } from "../../shared/utils/sender";
import { throwAfterTimeout } from "../../shared/utils/timing";

export default async function authenticate(
  challengeNonce: string,
  sender: MessageSender,
  libraryVersion: string,
  userInteractionTimeout: number,
  lang?: string,
): Promise<ExtensionAuthenticateResponse | ExtensionFailureResponse> {
  let nativeAppService: NativeAppService | undefined;
  let nativeAppStatus: { version: string } | undefined;

  try {
    nativeAppService = new NativeAppService();
    nativeAppStatus  = await nativeAppService.connect();

    config.DEBUG && console.log("Authenticate: connected to native", nativeAppStatus);

    const message: NativeAuthenticateRequest = {
      command: "authenticate",

      arguments: {
        challengeNonce,

        origin: (new URL(getSenderUrl(sender))).origin,

        ...(lang ? { lang } : {}),
      },
    };

    const response = await Promise.race([
      nativeAppService.send<NativeAuthenticateResponse>(message),

      throwAfterTimeout(userInteractionTimeout, new UserTimeoutError()),
    ]);

    config.DEBUG && console.log("Authenticate: authentication token received");

    const isResponseValid = (
      response?.unverifiedCertificate &&
      response?.algorithm             &&
      response?.signature             &&
      response?.format                &&
      response?.appVersion
    );

    if (isResponseValid) {
      return { action: Action.AUTHENTICATE_SUCCESS, ...response };
    } else {
      throw new UnknownError("unexpected response from native application");
    }
  } catch (error) {
    console.error("Authenticate:", error);

    return actionErrorHandler(Action.AUTHENTICATE_FAILURE, error, libraryVersion, nativeAppStatus?.version);
  } finally {
    nativeAppService?.close();
  }
}
