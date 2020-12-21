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
  TokenSigningSignResponse,
  TokenSigningErrorResponse,
} from "../../../models/TokenSigning/TokenSigningResponse";
import { throwAfterTimeout } from "../../../shared/utils";
import errorToResponse from "./errorToResponse";

export default async function sign(
  nonce: string,
  sourceUrl: string,
  certificate: string,
  hash: string,
  algorithm: string,
  lang?: string,
): Promise<TokenSigningSignResponse | TokenSigningErrorResponse> {
  try {
    const nativeAppService = new NativeAppService();
    const nativeAppStatus  = await nativeAppService.connect();

    console.log("Sign: connected to native", nativeAppStatus);

    const signatureResponse = await Promise.race([
      nativeAppService.send({
        command: "sign",

        arguments: {
          "doc-hash":      new ByteArray().fromHex(hash).toBase64(),
          "hash-algo":     algorithm,
          "origin":        (new URL(sourceUrl)).origin,
          "user-eid-cert": new ByteArray().fromHex(certificate).toBase64(),

          // TODO: Implement i18n in native application
          // "lang": lang
        },
      }),
      throwAfterTimeout(config.TOKEN_SIGNING_USER_INTERACTION_TIMEOUT, new UserTimeoutError()),
    ]) as { signature: string; error: string };

    if (!signatureResponse.signature) {
      return tokenSigningResponse<TokenSigningErrorResponse>("technical_error", nonce);
    } else {
      return tokenSigningResponse<TokenSigningSignResponse>("ok", nonce, {
        signature: new ByteArray().fromBase64(signatureResponse.signature).toHex(),
      });
    }
  } catch (error) {
    console.error(error);
    return errorToResponse(nonce, error);
  }
}
