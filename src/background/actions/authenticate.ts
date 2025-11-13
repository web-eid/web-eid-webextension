/*
 * Copyright (c) 2020-2025 Estonian Information System Authority
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

import { ExtensionAuthenticateResponse, ExtensionFailureResponse } from "@web-eid.js/models/message/ExtensionResponse";
import Action from "@web-eid.js/models/Action";
import { NativeAuthenticateRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeAuthenticateResponse } from "@web-eid.js/models/message/NativeResponse";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";

import { MessageSender } from "../../models/Browser/Runtime";
import NativeAppService from "../services/NativeAppService";
import UnknownError from "@web-eid.js/errors/UnknownError";
import actionErrorHandler from "../../shared/actionErrorHandler";
import { getSenderUrl } from "../../shared/utils/sender";

import Logger from "../../shared/Logger";

const logger = new Logger("authenticate.ts");

export default async function authenticate(
  challengeNonce: string,
  sender: MessageSender,
  libraryVersion: string,
  userInteractionTimeout: number,
  lang?: string,
): Promise<ExtensionAuthenticateResponse | ExtensionFailureResponse> {
  logger.tabId = sender.tab?.id;

  logger.log("Authentication requested");
  
  let nativeAppService: NativeAppService | undefined;
  let nativeAppStatus: { version: string } | undefined;

  try {
    nativeAppService = new NativeAppService(sender.tab?.id);
    nativeAppStatus  = await nativeAppService.connect();

    const message: NativeAuthenticateRequest = {
      command: "authenticate",

      arguments: {
        challengeNonce,

        origin: (new URL(getSenderUrl(sender))).origin,

        ...(lang ? { lang } : {}),
      },
    };

    const response = await nativeAppService.send<NativeAuthenticateResponse>(
      message,
      userInteractionTimeout,
      new UserTimeoutError(),
    );

    const isResponseValid = (
      response?.unverifiedCertificate &&
      response?.algorithm             &&
      response?.signature             &&
      response?.format                &&
      response?.appVersion
    );

    if (isResponseValid) {
      logger.info("Returning success response");

      return { action: Action.AUTHENTICATE_SUCCESS, ...response };
    } else {
      logger.info("Authentication response is invalid");

      throw new UnknownError("unexpected response from native application");
    }
  } catch (error) {
    logger.info("Authentication failed");
    logger.error(error);

    return actionErrorHandler(Action.AUTHENTICATE_FAILURE, error, libraryVersion, nativeAppStatus?.version);
  } finally {
    nativeAppService?.close();
  }
}
