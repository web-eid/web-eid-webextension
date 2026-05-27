// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
