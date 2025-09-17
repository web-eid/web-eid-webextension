/*
 * Copyright (c) 2020-2025 Estonian Information System Authority
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

import { config, defaultConfig, loadConfigFromStorage, setConfigOverride } from "./configManager";
import { Port } from "../models/Browser/Runtime";
import isBrowserStorageEnabled from "./utils/isBrowserStorageEnabled";

class DevToolsBridge extends EventTarget {

  devToolPorts: Array<Port> = [];

  constructor() {
    super();

    browser.runtime.onConnect.addListener(async (port: Port) => {
      if (port.name === "webeid-devtools") {
        this.devToolPorts.push(port);
      }

      port.onMessage.addListener(async (message) => {
        if (message.devtools === "setting-set") {
          await setConfigOverride(message.key, message.value);

          this.send({ devtools: "settings", config, defaultConfig }, { ignore: port });
        }
      });

      port.onDisconnect.addListener(() => {
        this.devToolPorts = this.devToolPorts.filter((connectedPort) => connectedPort !== port);
      });

      await loadConfigFromStorage();
      port.postMessage({ devtools: "settings", config, defaultConfig });
    });
  }

  send(message: object, options?: { ignore: Port }) {
    this.devToolPorts
      .filter((port) => !options?.ignore || port !== options.ignore)
      .forEach((port) => port.postMessage(message));
  }

  async isDevToolsEnabled() {
    const isDevToolsOptional    = Boolean(browser.runtime.getManifest().optional_permissions?.includes("devtools"));
    const hasDevToolsPermission = await browser.permissions.contains({ permissions: ["devtools"] });

    if (isDevToolsOptional && hasDevToolsPermission) {
      return true;
    }

    const isStorageEnabled = await isBrowserStorageEnabled();
    if (isStorageEnabled) {
      const { devtoolsEnabled } = await browser.storage.local.get(["devtoolsEnabled"]);

      return Boolean(devtoolsEnabled);
    }

    return false;
  }

}

export default new DevToolsBridge();
