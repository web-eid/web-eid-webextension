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

import Action from "@web-eid/web-eid-library/models/Action";
import ContextInsecureError from "@web-eid/web-eid-library/errors/ContextInsecureError";

import config from "../config";
import HttpResponse from "../models/HttpResponse";
import { TokenSigningErrorResponse } from "../models/TokenSigning/TokenSigningResponse";
import { headersToObject } from "../shared/utils";
import tokenSigningResponse from "../shared/tokenSigningResponse";
import injectPageScript from "./TokenSigning/injectPageScript";

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

async function fetchProxy<T>(fetchUrl: string, init?: RequestInit): Promise<HttpResponse<T>> {
  const response = await fetch(fetchUrl, init);

  const headers = headersToObject(response.headers);

  const body = (
    headers["content-type"]?.includes("application/json")
      ? (await response.json())
      : (await response.text())
  ) as T;

  const {
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
  } = response;

  return {
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
    headers,
    body,
  };
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetch") {
    fetchProxy(request.fetchUrl, request.init)
      .then(sendResponse)
      .catch(sendResponse);

    return true;
  }

  return false;
});

// --[ chrome-token-signing backwards compatibility ]---------------------------
if (config.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY) {
  injectPageScript();
}
