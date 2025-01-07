// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import Action from "@web-eid.js/models/Action";
import { NativeGetSigningCertificateRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeGetSigningCertificateResponse } from "@web-eid.js/models/message/NativeResponse";
import UnknownError from "@web-eid.js/errors/UnknownError";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";

import {
  ExtensionFailureResponse,
  ExtensionGetSigningCertificateResponse,
} from "@web-eid.js/models/message/ExtensionResponse";

import { MessageSender } from "../../models/Browser/Runtime";
import NativeAppService from "../services/NativeAppService";
import actionErrorHandler from "../../shared/actionErrorHandler";
import { getSenderUrl } from "../../shared/utils/sender";

import Logger from "../../shared/Logger";

const logger = new Logger("getSigningCertificate.ts");

export default async function getSigningCertificate(
  sender: MessageSender,
  libraryVersion: string,
  userInteractionTimeout: number,
  lang?: string,
): Promise<ExtensionGetSigningCertificateResponse | ExtensionFailureResponse> {
  logger.tabId = sender.tab?.id;

  logger.log("Certificate requested");

  let nativeAppService: NativeAppService | undefined;
  let nativeAppStatus: { version: string } | undefined;

  try {
    nativeAppService = new NativeAppService(sender.tab?.id);
    nativeAppStatus = await nativeAppService.connect();

    const message: NativeGetSigningCertificateRequest = {
      command: "get-signing-certificate",

      arguments: {
        origin: (new URL(getSenderUrl(sender))).origin,

        ...(lang ? { lang } : {}),
      },
    };

    const response = await nativeAppService.send<NativeGetSigningCertificateResponse>(
      message,
      userInteractionTimeout,
      new UserTimeoutError(),
    );

    const isResponseValid = (
      response?.certificate &&
      response?.supportedSignatureAlgorithms.length
    );

    if (isResponseValid) {
      logger.info("Returning success response");

      return { action: Action.GET_SIGNING_CERTIFICATE_SUCCESS, ...response };
    } else {
      logger.info("Certificate response is invalid");

      throw new UnknownError("unexpected response from native application");
    }
  } catch (error: any) {
    logger.info("Certificate request failed");
    logger.error(error);

    return actionErrorHandler(Action.GET_SIGNING_CERTIFICATE_FAILURE, error, libraryVersion, nativeAppStatus?.version);
  } finally {
    nativeAppService?.close();
  }
}
