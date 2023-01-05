/*
 * Copyright (c) 2020-2023 Estonian Information System Authority
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

import Action from "@web-eid.js/models/Action";
import ContextInsecureError from "@web-eid.js/errors/ContextInsecureError";

import { TokenSigningErrorResponse } from "../models/TokenSigning/TokenSigningResponse";
import config from "../config";
import injectPageScript from "./TokenSigning/injectPageScript";
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
    // Warning messages should be ignored.
    // When there are deprecation warnings, these messages would be sent by the content script and handled by the Web-eID library.
    if (event.data.action === Action.WARNING) return;

    config.DEBUG && console.log("Web-eID event: ", event);

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
          response = await send(event.data);
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

        case Action.GET_SIGNING_CERTIFICATE: {
          window.postMessage({ action: Action.GET_SIGNING_CERTIFICATE_ACK }, event.origin);
          response = await send(event.data);
          break;
        }
      }

      if (response) {
        window.postMessage(response, event.origin);
      }
    }
  } else if (config.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY && isTokenSigningEvent(event)) {
    config.DEBUG && console.log("TokenSigning event:", event);

    if (!window.isSecureContext) {
      console.error(new ContextInsecureError());

      const nonce    = event.data.nonce;
      const response = tokenSigningResponse<TokenSigningErrorResponse>("technical_error", nonce);

      window.postMessage(response, event.origin);
    } else {
      const response = await send(event.data) as { warnings?: [], [key: string]: any } | void;

      response?.warnings?.forEach((warning) => console.warn(warning));

      window.postMessage(response, event.origin);
    }
  }
});

// --[ chrome-token-signing backwards compatibility ]---------------------------
if (config.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY) {
  injectPageScript();
}
