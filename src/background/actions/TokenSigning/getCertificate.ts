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
