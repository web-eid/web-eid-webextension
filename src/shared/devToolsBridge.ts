// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import { config, configInitialized, defaultConfig, setConfigOverride } from "./configManager";
import { Port } from "../models/Browser/Runtime";

class DevToolsBridge extends EventTarget {

  devToolPorts: Array<Port> = [];

  constructor() {
    super();

    browser.runtime.onConnect.addListener(async (port: Port) => {
      await this.connectToPort(port);
    });
  }

  send(message: object, options?: { ignore: Port }) {
    this.devToolPorts
      .filter((port) => !options?.ignore || port !== options.ignore)
      .forEach((port) => port.postMessage(message));
  }

  private async connectToPort(port: Port) {
    if (port.name === "webeid-devtools") {
      this.devToolPorts.push(port);
    }

    port.onMessage.addListener((message) => {
      if (message.devtools === "setting-set") {
        setConfigOverride(message.key, message.value);

        this.send({ devtools: "settings", config, defaultConfig }, { ignore: port });
      }
    });

    port.onDisconnect.addListener(() => {
      this.devToolPorts = this.devToolPorts.filter((connectedPort) => connectedPort !== port);
    });

    await configInitialized;
    port.postMessage({ devtools: "settings", config, defaultConfig });
  }

}

export default new DevToolsBridge();
