// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import { NativeGetSigningCertificateRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeGetSigningCertificateResponse } from "@web-eid.js/models/message/NativeResponse";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";

import {
  TokenSigningCertResponse,
  TokenSigningErrorResponse,
} from "../../../models/TokenSigning/TokenSigningResponse";

import ByteArray from "../../../shared/ByteArray";
import NativeAppService from "../../services/NativeAppService";
import config from "../../../config";
import errorToResponse from "./errorToResponse";
import threeLetterLanguageCodes from "./threeLetterLanguageCodes";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";

export default async function getCertificate(
  nonce: string,
  sourceUrl: string,
  lang?: string,
  filter: "AUTH" | "SIGN" = "SIGN",
): Promise<TokenSigningCertResponse | TokenSigningErrorResponse> {
  if (lang && Object.keys(threeLetterLanguageCodes).includes(lang)) {
    lang = threeLetterLanguageCodes[lang];
  }

  const nativeAppService = new NativeAppService();

  if (filter !== "SIGN") {
    const { message, name, stack } = new Error("Web-eID only allows signing with a signing certificate");

    return tokenSigningResponse<TokenSigningErrorResponse>("not_allowed", nonce, {
      message,
      name,
      stack,
    });
  }

  try {
    const nativeAppStatus = await nativeAppService.connect();

    config.DEBUG && console.log("Get certificate: connected to native", nativeAppStatus);

    const message: NativeGetSigningCertificateRequest = {
      command: "get-signing-certificate",

      arguments: {
        origin: (new URL(sourceUrl)).origin,

        ...(lang ? { lang } : {}),
      },
    };

    const response = await nativeAppService.send<NativeGetSigningCertificateResponse>(
      message,
      config.TOKEN_SIGNING_USER_INTERACTION_TIMEOUT,
      new UserTimeoutError(),
    );

    if (!response?.certificate) {
      return tokenSigningResponse<TokenSigningErrorResponse>("no_certificates", nonce);
    } else {
      return tokenSigningResponse<TokenSigningCertResponse>("ok", nonce, {
        cert: new ByteArray().fromBase64(response.certificate).toHex(),
      });
    }
  } catch (error) {
    console.error(error);
    return errorToResponse(nonce, error);
  } finally {
    nativeAppService.close();
  }
}
