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

import Action from "@web-eid/web-eid-library/models/Action";
import ContextInsecureError from "@web-eid/web-eid-library/errors/ContextInsecureError";

import config from "../config";
import TypedMap from "../models/TypedMap";
import TokenSigningPromise from "../models/TokenSigning/TokenSigningPromise";
import { TokenSigningCertResponse, TokenSigningErrorResponse, TokenSigningResponse } from "../models/TokenSigning/TokenSigningResponse";
import {
  TokenSigningMessage,
  TokenSigningGetCertificateMessage,
  TokenSigningSignMessage,
  TokenSigningVersionMessage,
} from "../models/TokenSigning/TokenSigningMessage";
import tokenSigningResponse from "../shared/tokenSigningResponse";

function isWebeidEvent(event: MessageEvent): boolean {
  return (
    event.source === window &&
    event.data?.action?.startsWith?.("web-eid:")
  );
}

function isTokenSigningEvent(event: MessageEvent): boolean {
  return (
    event.source === window &&
    event.data.nonce &&
    ["VERSION", "CERT", "SIGN"].includes(event.data.type)
  );
}

async function send(message: object): Promise<object | void> {
  const response = await browser.runtime.sendMessage(message);
  return response;
}

window.addEventListener("message", async (event) => {
  if (isWebeidEvent(event)) {
    console.log("Web-eID event: ", event);

    if (!window.isSecureContext) {
      const response = {
        action: event.data.action + "_FAILURE",
        error:  new ContextInsecureError(),
      };

      window.postMessage(response, event.origin);

    } else {
      let response;

      switch (event.data.action) {
        case Action.STATUS: {
          window.postMessage({ action: Action.STATUS_ACK }, event.origin);
          response = await send({ action: Action.STATUS });
          break;
        }

        case Action.AUTHENTICATE: {
          window.postMessage({ action: Action.AUTHENTICATE_ACK }, event.origin);
          response = await send(event.data);
          break;
        }

        case Action.SIGN: {
          window.postMessage({ action: Action.SIGN_ACK }, event.origin);
          response = await send(event.data);
          break;
        }
      }

      if (response) {
        window.postMessage(response, event.origin);
      }
    }
  } else if (isTokenSigningEvent(event)) {
    console.log("TokenSigning event:", event);

    if (!window.isSecureContext) {
      console.error(new ContextInsecureError());

      const nonce    = event.data.nonce;
      const response = tokenSigningResponse<TokenSigningErrorResponse>("technical_error", nonce);

      window.postMessage(response, event.origin);
    } else {
      window.postMessage(await send(event.data), event.origin);
    }
  }
});


// --[ chrome-token-signing backwards compatibility ]---------------------------

declare global {
  interface Window {
    TokenSigning: Function;
  }
}

if (config.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY) {

  const pageScript = function(): void {
    let hasDeprecationWarningDisplayed = false;

    const eidPromises: TypedMap<TokenSigningPromise> = {};

    // Turn the incoming message from extension
    // into pending Promise resolving
    window.addEventListener("message", function (event) {
      if (event.source !== window) return;

      if (event.data.src && (event.data.src === "background.js")) {
        console.log("Page received: ");
        console.log(event.data);

        // Get the promise
        if (event.data.nonce) {
          const p = eidPromises[event.data.nonce];

          if (event.data.result === "ok") {
            if (event.data.signature !== undefined) {
              p.resolve({ hex: event.data.signature });
            } else if (event.data.version !== undefined) {
              p.resolve(event.data.extension + "/" + event.data.version);
            } else if (event.data.cert !== undefined) {
              p.resolve({ hex: event.data.cert });
            } else {
              console.log("No idea how to handle message");
              console.log(event.data);
            }
          } else {
            p.reject(new Error(event.data.result));
          }

          delete eidPromises[event.data.nonce];
        } else {
          console.log("No nonce in event msg");
        }
      }
    }, false);

    function nonce(): string {
      let val = "";
      const hex = "abcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < 16; i++) val += hex.charAt(Math.floor(Math.random() * hex.length));
      return val;
    }

    function messagePromise<TMessage extends TokenSigningMessage, TResponse extends TokenSigningResponse>(
      msg: TMessage
    ): Promise<TResponse> {
      if (!hasDeprecationWarningDisplayed) {
        console.warn("TokenSigning API is deprecated. Please consider switching to the new Web-eID library.");
        hasDeprecationWarningDisplayed = true;
      }

      return new Promise(function (resolve, reject) {
        // send message
        window.postMessage(msg, "*");
        // and store promise callbacks
        eidPromises[msg.nonce] = { resolve, reject };
      });
    }

    window.TokenSigning = class TokenSigning {
      getCertificate(options: {lang?: string; filter?: "AUTH" | "SIGN"}): Promise<TokenSigningCertResponse> {
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
      ): Promise<TokenSigningResponse> {
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

      getVersion(): Promise<TokenSigningResponse> {
        const msg: TokenSigningVersionMessage = {
          src:   "page.js",
          nonce: nonce(),
          type:  "VERSION",
        };

        console.log("getVersion()");
        return messagePromise(msg);
      }
    };
  };

  /**
   * Check the page for an existing TokenSigning page script.
   * The script will be injected to the DOM of every page, which doesn't already have the script.
   * To circumvent Content Security Policy issues, the website can include the script on its own.
   *
   * Example:
   *   <script src="path-to/page.js" data-name="TokenSigning"></script>
   *
   * The page script can be found here:
   *   https://github.com/open-eid/chrome-token-signing/blob/master/extension/page.js
   */
  if (!document.querySelector("script[data-name='TokenSigning']")) {
    const s = document.createElement("script");

    s.type         = "text/javascript";
    s.dataset.name = "TokenSigning";
    s.dataset.by   = "Web-eID extension";
    s.innerHTML    = "(" + pageScript + ")();";

    (document.head || document.documentElement).appendChild(s);
  }
}
