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
import libraryConfig from "@web-eid/web-eid-library/config";

import { LibraryMessage } from "../models/LibraryMessage";
import { MessageSender } from "../models/Browser/Runtime";
import authenticate from "./actions/authenticate";
import sign from "./actions/sign";
import getStatus from "./actions/getStatus";

import { TokenSigningMessage } from "../models/TokenSigning/TokenSigningMessage";
import TokenSigningAction from "./actions/TokenSigning";

async function onAction(message: LibraryMessage): Promise<void | object> {
  switch (message.action) {
    case Action.AUTHENTICATE:
      return await authenticate(
        message.getAuthChallengeUrl,
        message.postAuthTokenUrl,
        message.headers,
        message.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.serverRequestTimeout   || libraryConfig.DEFAULT_SERVER_REQUEST_TIMEOUT,
        message.lang,
      );

    case Action.SIGN:
      return await sign(
        message.postPrepareSigningUrl,
        message.postFinalizeSigningUrl,
        message.headers,
        message.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.serverRequestTimeout   || libraryConfig.DEFAULT_SERVER_REQUEST_TIMEOUT,
        message.lang,
      );

    case Action.STATUS:
      return await getStatus();
  }
}

async function onTokenSigningAction(message: TokenSigningMessage, sender: MessageSender): Promise<void | object> {
  if (!sender.url) return;

  switch (message.type) {
    case "VERSION": {
      return await TokenSigningAction.getStatus(
        message.nonce,
      );
    }

    case "CERT": {
      return await TokenSigningAction.getCertificate(
        message.nonce,
        sender.url,
        message.lang,
        message.filter,
      );
    }

    case "SIGN": {
      return await TokenSigningAction.sign(
        message.nonce,
        sender.url,
        message.cert,
        message.hash,
        message.hashtype,
        message.lang,
      );
    }
  }
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if ((message as LibraryMessage).action) {
    onAction(message).then(sendResponse);
  } else if ((message as TokenSigningMessage).type) {
    onTokenSigningAction(message, sender).then(sendResponse);
  }
  return true;
});
