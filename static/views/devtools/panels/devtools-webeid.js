import events from "./webeid-events.js";
import log from "./webeid-log.js";
import settings from "./webeid-settings.js";


const backgroundConnection = chrome.runtime.connect({
  name: "webeid-devtools",
});

backgroundConnection.onMessage.addListener((message) => {
  if (!message.tabId || message.tabId === chrome.devtools.inspectedWindow.tabId) {
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
