// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
import { getSenderUrl } from "../../shared/utils/sender";

import Logger from "../../shared/Logger";

const logger = new Logger("sign.ts");

export default async function sign(
  certificate: string,
  hash: string,
  hashFunction: string,
  sender: MessageSender,
  libraryVersion: string,
  userInteractionTimeout: number,
  lang?: string,
): Promise<ExtensionSignResponse | ExtensionFailureResponse> {
  logger.tabId = sender.tab?.id;

  logger.log("Signing requested");

  let nativeAppService: NativeAppService | undefined;
  let nativeAppStatus: { version: string } | undefined;

  try {
    nativeAppService = new NativeAppService(sender.tab?.id);
    nativeAppStatus  = await nativeAppService.connect();

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
      logger.info("Returning success response");

      return { action: Action.SIGN_SUCCESS, ...response };
    } else {
      logger.info("Signing response is invalid");

      throw new UnknownError("unexpected response from native application");
    }
  } catch (error) {
    logger.info("Signing failed");
    logger.error(error);

    return actionErrorHandler(Action.SIGN_FAILURE, error, libraryVersion, nativeAppStatus?.version);
  } finally {
    nativeAppService?.close();
  }
}
