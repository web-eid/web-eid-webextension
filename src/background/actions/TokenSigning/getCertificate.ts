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
import { MessageSender } from "../../../models/Browser/Runtime";
import NativeAppService from "../../services/NativeAppService";
import { config } from "../../../shared/configManager";
import errorToResponse from "./errorToResponse";
import threeLetterLanguageCodes from "./threeLetterLanguageCodes";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";

import Logger from "../../../shared/Logger";

const logger = new Logger("TokenSigning/getCertificate.ts");

export default async function getCertificate(
  sender: MessageSender,
  nonce: string,
  sourceUrl: string,
  lang?: string,
  filter: "AUTH" | "SIGN" = "SIGN",
): Promise<TokenSigningCertResponse | TokenSigningErrorResponse> {
  logger.tabId = sender.tab?.id;

  logger.log("Certificate requested");

  if (lang && Object.keys(threeLetterLanguageCodes).includes(lang)) {
    lang = threeLetterLanguageCodes[lang];
    logger.log("Language code converted to three-letter code", lang);
  }

  const nativeAppService = new NativeAppService(sender.tab?.id);

  logger.info("Checking 'filter', should be 'SIGN'");

  if (filter !== "SIGN") {
    const { message, name, stack } = new Error("Web-eID only allows signing with a signing certificate");

    logger.error({ message, name, stack });

    return tokenSigningResponse<TokenSigningErrorResponse>("not_allowed", nonce, {
      message,
      name,
      stack,
    });
  }

  try {
    await nativeAppService.connect();

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
      logger.info("Certificate request failed. Expected 'certificate' was not found in the response");

      return tokenSigningResponse<TokenSigningErrorResponse>("no_certificates", nonce);
    } else {
      logger.info("Returning success response");

      return tokenSigningResponse<TokenSigningCertResponse>("ok", nonce, {
        cert: new ByteArray().fromBase64(response.certificate).toHex(),
      });
    }
  } catch (error) {
    logger.info("Certificate request failed");
    logger.error(error);

    return errorToResponse(nonce, error);
  } finally {
    nativeAppService.close();
  }
}
