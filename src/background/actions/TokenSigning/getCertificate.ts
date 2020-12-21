/*
 * Copyright (c) 2020 The Web eID Project
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

import UserTimeoutError from "@web-eid/web-eid-library/errors/UserTimeoutError";

import config from "../../../config";
import ByteArray from "../../../shared/ByteArray";
import NativeAppService from "../../services/NativeAppService";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";
import {
  TokenSigningCertResponse,
  TokenSigningErrorResponse,
} from "../../../models/TokenSigning/TokenSigningResponse";
import { throwAfterTimeout } from "../../../shared/utils";
import errorToResponse from "./errorToResponse";

export default async function getCertificate(
  nonce: string,
  sourceUrl: string,
  lang?: string,
  filter: "AUTH" | "SIGN" = "SIGN",
): Promise<TokenSigningCertResponse | TokenSigningErrorResponse> {
  try {
    const nativeAppService = new NativeAppService();
    const nativeAppStatus  = await nativeAppService.connect();

    console.log("Get certificate: connected to native", nativeAppStatus);

    const certificateResponse = await Promise.race([
      nativeAppService.send({
        command: "get-certificate",

        arguments: {
          "type":   filter.toLowerCase(),
          "origin": (new URL(sourceUrl)).origin,

          // TODO: Implement i18n in native application
          // "lang": lang
        },
      }),

      throwAfterTimeout(config.TOKEN_SIGNING_USER_INTERACTION_TIMEOUT, new UserTimeoutError()),
    ]) as {
      certificate: string;
      error?: string;

      "supported-signature-algos": Array<{
        "crypto-algo": string;
        "hash-algo": string;
        "padding-algo": string;
      }>;
    };

    if (!certificateResponse.certificate) {
      return tokenSigningResponse<TokenSigningErrorResponse>("no_certificates", nonce);
    } else {
      return tokenSigningResponse<TokenSigningCertResponse>("ok", nonce, {
        cert: new ByteArray().fromBase64(certificateResponse.certificate).toHex(),
      });
    }
  } catch (error) {
    console.error(error);
    return errorToResponse(nonce, error);
  }
}
