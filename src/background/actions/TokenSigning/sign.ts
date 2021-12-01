/*
 * Copyright (c) 2020-2021 Estonian Information System Authority
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

import { NativeSignRequest } from "@web-eid.js/models/message/NativeRequest";
import { NativeSignResponse } from "@web-eid.js/models/message/NativeResponse";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";

import {
  TokenSigningErrorResponse,
  TokenSigningSignResponse,
} from "../../../models/TokenSigning/TokenSigningResponse";

import ByteArray from "../../../shared/ByteArray";
import NativeAppService from "../../services/NativeAppService";
import config from "../../../config";
import digestCommands from "./digestCommands";
import errorToResponse from "./errorToResponse";
import threeLetterLanguageCodes from "./threeLetterLanguageCodes";
import { throwAfterTimeout } from "../../../shared/utils/timing";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";

export default async function sign(
  nonce: string,
  sourceUrl: string,
  certificate: string,
  hash: string,
  algorithm: string,
  lang?: string,
): Promise<TokenSigningSignResponse | TokenSigningErrorResponse> {
  if (lang && Object.keys(threeLetterLanguageCodes).includes(lang)) {
    lang = threeLetterLanguageCodes[lang];
  }

  const nativeAppService = new NativeAppService();

  try {
    const nativeAppStatus = await nativeAppService.connect();

    config.DEBUG && console.log("Sign: connected to native", nativeAppStatus);

    const message: NativeSignRequest = {
      command: "sign",

      arguments: {
        hash:         new ByteArray().fromHex(hash).toBase64(),
        hashFunction: Object.keys(digestCommands).includes(algorithm) ? digestCommands[algorithm] : algorithm,
        origin:       (new URL(sourceUrl)).origin,
        certificate:  new ByteArray().fromHex(certificate).toBase64(),

        ...(lang ? { lang } : {}),
      },
    };

    const response = await Promise.race([
      nativeAppService.send<NativeSignResponse>(message),
      throwAfterTimeout(config.TOKEN_SIGNING_USER_INTERACTION_TIMEOUT, new UserTimeoutError()),
    ]);

    if (!response?.signature) {
      return tokenSigningResponse<TokenSigningErrorResponse>("technical_error", nonce);
    } else {
      return tokenSigningResponse<TokenSigningSignResponse>("ok", nonce, {
        signature: new ByteArray().fromBase64(response.signature).toHex(),
      });
    }
  } catch (error) {
    console.error(error);
    return errorToResponse(nonce, error);
  } finally {
    nativeAppService.close();
  }
}
