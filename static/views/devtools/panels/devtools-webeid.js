/*
 * Copyright (c) 2024-2025 Estonian Information System Authority
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
  if (!message.tabId || message.tabId === browser.devtools.inspectedWindow.tabId) {
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
