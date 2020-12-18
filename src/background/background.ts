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
import libraryConfig from "@web-eid/web-eid-library/config";

import { LibraryMessage } from "../models/LibraryMessage";
import authenticate from "./actions/authenticate";
import sign from "./actions/sign";
import getStatus from "./actions/getStatus";

browser.runtime.onMessage.addListener((message: LibraryMessage, sender: any, sendResponse: any) => {
  switch (message.action) {
    case Action.AUTHENTICATE:
      authenticate(
        message.getAuthChallengeUrl,
        message.postAuthTokenUrl,
        message.headers,
        message.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.serverRequestTimeout   || libraryConfig.DEFAULT_SERVER_REQUEST_TIMEOUT,
      ).then(sendResponse);
      break;

    case Action.SIGN:
      sign(
        message.postPrepareSigningUrl,
        message.postFinalizeSigningUrl,
        message.headers,
        message.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.serverRequestTimeout   || libraryConfig.DEFAULT_SERVER_REQUEST_TIMEOUT,
      ).then(sendResponse);
      break;

    case Action.STATUS:
      getStatus().then(sendResponse);

  }
  return true;
});
