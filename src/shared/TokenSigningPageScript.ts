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

import {
  TokenSigningGetCertificateMessage,
  TokenSigningMessage,
  TokenSigningSignMessage,
  TokenSigningVersionMessage,
} from "../models/TokenSigning/TokenSigningMessage";
import {
  TokenSigningResponse,
  TokenSigningResult,
} from "../models/TokenSigning/TokenSigningResponse";

import { isRecord } from "./utils/typeGuards";

import TokenSigningPromise from "../models/TokenSigning/TokenSigningPromise";

declare global {
  interface Window {
    TokenSigning: unknown;
  }
}

interface TokenSigningHexResult {
  hex: string;
}

type TokenSigningLegacyResult = TokenSigningHexResult | string;
type TokenSigningPageResponse =
  & TokenSigningResponse
  & {
    cert?: unknown;
    signature?: unknown;
    version?: unknown;
  };

const TOKEN_SIGNING_RESULTS = new Set<string>([
  "ok",
  "no_certificates",
  "invalid_argument",
  "user_cancel",
  "not_allowed",
  "driver_error",
  "pin_blocked",
  "technical_error",
]);

function isTokenSigningResult(result: unknown): result is TokenSigningResult {
  return typeof result === "string" && TOKEN_SIGNING_RESULTS.has(result);
}

function isTokenSigningPageResponse(data: unknown): data is TokenSigningPageResponse {
  return (
    isRecord(data) &&
    data.src === "background.js" &&
    typeof data.nonce === "string" &&
    typeof data.extension === "string" &&
    data.isWebeid === true &&
    isTokenSigningResult(data.result)
  );
}

export default function pageScript(): void {
  let hasDeprecationWarningDisplayed = false;

  const eidPromises: Record<string, TokenSigningPromise<TokenSigningLegacyResult>> = {};

  // Turn the incoming message from extension
  // into pending Promise resolving
  window.addEventListener("message", function (event: MessageEvent<unknown>) {
    if (event.source !== window) return;

    if (isTokenSigningPageResponse(event.data)) {
      console.log("Page received: ");
      console.log(event.data);

      // Get the promise
      const p = eidPromises[event.data.nonce];

      if (!p) {
        console.log("No promise for event msg");
        console.log(event.data);
        return;
      }

      if (event.data.result === "ok") {
        if (typeof event.data.signature === "string") {
          p.resolve({ hex: event.data.signature });
        } else if (typeof event.data.version === "string") {
          p.resolve(event.data.extension + "/" + event.data.version);
        } else if (typeof event.data.cert === "string") {
          p.resolve({ hex: event.data.cert });
        } else {
          console.log("No idea how to handle message");
          console.log(event.data);
        }
      } else {
        p.reject(new Error(event.data.result));
      }

      delete eidPromises[event.data.nonce];
    }
  }, false);

  function nonce(): string {
    let val = "";
    const hex = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 16; i++) val += hex.charAt(Math.floor(Math.random() * hex.length));
    return val;
  }

  function messagePromise<TResponse extends TokenSigningLegacyResult>(
    msg: TokenSigningMessage
  ): Promise<TResponse> {
    if (!hasDeprecationWarningDisplayed) {
      console.warn("TokenSigning API is deprecated. Please consider switching to the new Web-eID library.");
      hasDeprecationWarningDisplayed = true;
    }

    return new Promise(function (resolve, reject) {
      // send message
      window.postMessage(msg, "*");
      // and store promise callbacks
      eidPromises[msg.nonce] = {
        reject,
        resolve: (value) => resolve(value as TResponse),
      };
    });
  }

  window.TokenSigning = class TokenSigning {
    getCertificate(options: { lang?: string; filter?: "AUTH" | "SIGN" }): Promise<TokenSigningHexResult> {
      const msg: TokenSigningGetCertificateMessage = {
        src:    "page.js",
        nonce:  nonce(),
        type:   "CERT",
        lang:   options.lang,
        filter: options.filter,
      };

      console.log("getCertificate()");
      return messagePromise(msg);
    }

    sign(
      cert: { hex: string },
      hash: { type: string; hex: string },
      options: { lang: string; info: string }
    ): Promise<TokenSigningHexResult> {
      const msg: TokenSigningSignMessage = {
        src:      "page.js",
        nonce:    nonce(),
        type:     "SIGN",
        cert:     cert.hex,
        hash:     hash.hex,
        hashtype: hash.type,
        lang:     options.lang,
        info:     options.info,
      };

      console.log("sign()");
      return messagePromise(msg);
    }

    getVersion(): Promise<string> {
      const msg: TokenSigningVersionMessage = {
        src:   "page.js",
        nonce: nonce(),
        type:  "VERSION",
      };

      console.log("getVersion()");
      return messagePromise(msg);
    }
  };
}
