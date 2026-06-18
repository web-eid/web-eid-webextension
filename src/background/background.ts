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

import Logger from "../shared/Logger";
import { loadConfigFromStorage } from "../shared/configManager";

const configLoaded = loadConfigFromStorage();

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
        sender,
        message.libraryVersion,
      );
  }
}

async function onTokenSigningAction(message: TokenSigningMessage, sender: MessageSender): Promise<void | object> {
  if (!sender.url) return;

  switch (message.type) {
    case "VERSION": {
      return await TokenSigningAction.status(
        sender,
        message.nonce,
      );
    }

    case "CERT": {
      return await TokenSigningAction.getCertificate(
        sender,
        message.nonce,
        sender.url,
        message.lang,
        message.filter,
      );
    }

    case "SIGN": {
      return await TokenSigningAction.sign(
        sender,
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
  const logger = new Logger("background.ts");

  logger.tabId = sender.tab?.id;

  if ((message as ExtensionRequest).action) {
    // Fire-and-forget: DevTools logging must not block message handling, using void to ignore Promise is the standard solution.
    void logger.devToolsEvent("request", "Extension (content)", "Extension (background)", message);

    void configLoaded
      .then(() => onAction(message, sender))
      .then((response) => {
        void logger.devToolsEvent("response", "Extension (content)", "Extension (background)", response);

        return response;
      })
      .then(sendResponse);

  } else if (message.devtools) {
    logger.devToolsProxy(message, sender);
    sendResponse();
  } else if ((message as TokenSigningMessage).type) {
    void logger.devToolsEvent("request", "Extension (content)", "Extension (background)", message);

    void configLoaded
      .then(() => onTokenSigningAction(message, sender))
      .then((response) => {
        void logger.devToolsEvent("response", "Extension (content)", "Extension (background)", response);

        return response;
      })
      .then(sendResponse);
  }

  return true;
});
