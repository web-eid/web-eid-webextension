// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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

    const response = await nativeAppService.send<NativeAuthenticateResponse>(
      message,
      userInteractionTimeout,
      new UserTimeoutError(),
    );

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
