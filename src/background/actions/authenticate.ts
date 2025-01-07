// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
