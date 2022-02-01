/*
 * Copyright (c) 2020-2022 Estonian Information System Authority
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
import { ExtensionRequest } from "@web-eid.js/models/message/ExtensionRequest";
import libraryConfig from "@web-eid.js/config";

import { MessageSender } from "../models/Browser/Runtime";
import TokenSigningAction from "./actions/TokenSigning";
import { TokenSigningMessage } from "../models/TokenSigning/TokenSigningMessage";
import authenticate from "./actions/authenticate";
import getSigningCertificate from "./actions/getSigningCertificate";
import sign from "./actions/sign";
import status from "./actions/status";

async function onAction(message: ExtensionRequest, sender: MessageSender): Promise<void | object> {
  switch (message.action) {
    case Action.AUTHENTICATE:
      return await authenticate(
        message.challengeNonce,

        sender,
        message.libraryVersion,
        message.options?.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.options?.lang
      );

    case Action.GET_SIGNING_CERTIFICATE:
      return await getSigningCertificate(
        sender,
        message.libraryVersion,
        message.options?.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.options?.lang
      );

    case Action.SIGN:
      return await sign(
        message.certificate,
        message.hash,
        message.hashFunction,

        sender,
        message.libraryVersion,
        message.options?.userInteractionTimeout || libraryConfig.DEFAULT_USER_INTERACTION_TIMEOUT,
        message.options?.lang
      );

    case Action.STATUS:
      return await status(
        message.libraryVersion,
      );
  }
}

async function onTokenSigningAction(message: TokenSigningMessage, sender: MessageSender): Promise<void | object> {
  if (!sender.url) return;

  switch (message.type) {
    case "VERSION": {
      return await TokenSigningAction.status(
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
  if ((message as ExtensionRequest).action) {
    onAction(message, sender).then(sendResponse);
  } else if ((message as TokenSigningMessage).type) {
    onTokenSigningAction(message, sender).then(sendResponse);
  }
  return true;
});

(async function () {
  if (typeof browser.pkcs11 === "undefined")
    return;
  async function unload(modname: string) {
    try {
      const isInstalled = await browser.pkcs11.isModuleInstalled(modname);
      if (!isInstalled) {
        console.log("module is not installed: " + modname);
        return;
      }
      await browser.pkcs11.uninstallModule(modname);
      console.log("Unloaded module " + modname);
    } catch (e) {
      console.error("Unable to unload module: ", e);
    }
  }
  unload("onepinopenscpkcs11");
  unload("idemiaawppkcs11");
})();
