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
import config from "../../config";
import { getSenderUrl } from "../../shared/utils/sender";

export default async function getSigningCertificate(
  sender: MessageSender,
  libraryVersion: string,
  userInteractionTimeout: number,
  lang?: string,
): Promise<ExtensionGetSigningCertificateResponse | ExtensionFailureResponse> {
  let nativeAppService: NativeAppService | undefined;
  let nativeAppStatus: { version: string } | undefined;

  try {
    nativeAppService = new NativeAppService();
    nativeAppStatus = await nativeAppService.connect();

    config.DEBUG && console.log("getSigningCertificate: connected to native", nativeAppStatus);

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
      return { action: Action.GET_SIGNING_CERTIFICATE_SUCCESS, ...response };
    } else {
      throw new UnknownError("unexpected response from native application");
    }
  } catch (error: any) {
    console.error("GetSigningCertificate:", error);

    return actionErrorHandler(Action.GET_SIGNING_CERTIFICATE_FAILURE, error, libraryVersion, nativeAppStatus?.version);
  } finally {
    nativeAppService?.close();
  }
}
