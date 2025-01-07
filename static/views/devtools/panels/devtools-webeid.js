// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import events from "./webeid-events.js";
import log from "./webeid-log.js";
import settings from "./webeid-settings.js";

const backgroundConnection = browser.runtime.connect({
  name: "webeid-devtools",
});

const keepAliveInterval = setInterval(() => {
  backgroundConnection.postMessage({ devtools: "keep-alive" });
}, 20000);

backgroundConnection.onDisconnect.addListener(() => {
  clearInterval(keepAliveInterval);

  log.append({
    source: "devtools-webeid.js",
    type: "error",
    time: new Date().toISOString().match(/T((.)*)Z/)[1],
    message: [
      "Web eID DevTools panel disconnected from the extension. Please reopen the browser DevTools to continue."
    ],
  });
});

backgroundConnection.onMessage.addListener((message) => {
  if (!message.tabId || message.tabId === browser.devtools.inspectedWindow.tabId || browser.devtools.inspectedWindow.tabId === -1) {
    if (message.devtools === "log") {
      log.append(message);

    } else if (message.devtools === "event") {
      events.append(message);

      const direction = (
        message.type === "request"
          ? "—►"
          : message.type === "response"
            ? "◄—"
            : "?"
      );

      log.append({
        time:    message.time,
        type:    "event",
        source:  `${message.layer1} ${direction} ${message.layer2}`,
        message: [message.data],
      });
    } else if (message.devtools === "settings") {
      const { config, defaultConfig } = message;

      settings.render(config, defaultConfig, backgroundConnection);

      document.querySelector('header .version').textContent = defaultConfig.VERSION;
    }
  }
});
