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

import { serializeError } from "@web-eid.js/utils/errorSerializer";

import { MessageSender } from "../models/Browser/Runtime";
import devToolsBridge from "./devToolsBridge";
import isBrowserStorageEnabled from "./utils/isBrowserStorageEnabled";

type Layer = "Website" | "Extension (content)" | "Extension (background)" | "Native app";

interface DevToolsLogMessage {
  devtools: "log";
  source: string;
  type: "log" | "info" | "warn" | "error";
  message: string;
  time: string;
}

interface DevToolsEventMessage {
  devtools: "event";
  type: "request" | "response";
  layer1: Layer;
  layer2: Layer;
  data: any;
  time: string;
}

export default class Logger {
  private module: string;
  private isContentScript = false;

  public tabId?: number;

  constructor(module: string, options?: { isContentScript: boolean }) {
    this.module = module;
    this.isContentScript = options?.isContentScript ?? this.isContentScript;
  }

  async log(...args: Array<any>): Promise<void> {
    await this.devToolsLog("log", args);
    console.log(...args);
  }

  async info(...args: Array<any>): Promise<void> {
    await this.devToolsLog("info", args);
    console.info(...args);
  }

  async warn(...args: Array<any>): Promise<void> {
    await this.devToolsLog("warn", args);
    console.warn(...args);
  }

  async error(...args: Array<any>): Promise<void> {
    await this.devToolsLog("error", args);
    console.error(...args);
  }

  async debug(...args: Array<any>): Promise<void> {
    await this.devToolsLog("debug", args);
    console.debug(...args);
  }

  async isDevToolsEnabled(): Promise<boolean> {
    const isOptionalPermissionDevToolsTurnedOn = Boolean(browser.runtime.getManifest().optional_permissions?.includes("devtools"));

    if (isOptionalPermissionDevToolsTurnedOn) {
      return true;
    }

    const isStorageEnabled = await isBrowserStorageEnabled();

    if (isStorageEnabled) {
      const { devtoolsEnabled } = await browser.storage.local.get(["devtoolsEnabled"]);

      return Boolean(devtoolsEnabled);
    }

    return false;
  }

  async devToolsLog(type: "event" | "log" | "info" | "warn" | "error" | "debug", rawMessage: Array<any>) {
    if (this.isContentScript || await this.isDevToolsEnabled()) {
      const time   = this.getCurrentTime();
      const source = this.module;

      const message = rawMessage.map((obj) => {
        if (obj instanceof Error || obj.stack != null) {
          return serializeError(obj);
        } else {
          return obj;
        }
      });

      const devToolsLogMessage = {
        devtools: "log",

        source,
        type,
        message,
        time,
      };

      if (this.isContentScript) {
        browser.runtime.sendMessage(devToolsLogMessage);
      } else {
        devToolsBridge.send({ tabId: this.tabId, ...devToolsLogMessage });
      }
    }
  }

  async devToolsEvent(type: "request" | "response", layer1: Layer, layer2: Layer, data: any) {
    if (this.isContentScript || await this.isDevToolsEnabled()) {
      const time = this.getCurrentTime();

      const devToolsEventMessage: DevToolsEventMessage = {
        devtools: "event",

        type,
        data,
        layer1,
        layer2,
        time,
      };

      if (this.isContentScript) {
        browser.runtime.sendMessage(devToolsEventMessage);
      } else {
        devToolsBridge.send({ tabId: this.tabId, ...devToolsEventMessage });
      }
    }
  }

  devToolsProxy(
    proxyMessage: DevToolsLogMessage | DevToolsEventMessage,
    sender: MessageSender,
  ) {
    if (proxyMessage.devtools == "log") {
      const { devtools, source, type, message, time } = proxyMessage;

      devToolsBridge.send({
        tabId: sender.tab?.id,

        devtools,
        source,
        type,
        message,
        time,
      });
    } else if (proxyMessage.devtools == "event") {
      const { devtools, type, data, layer1, layer2, time } = proxyMessage;

      devToolsBridge.send({
        tabId: sender.tab?.id,

        devtools,
        type,
        data,
        layer1,
        layer2,
        time
      });
    }
  }

  getCurrentTime() {
    const now = new Date();
    const [HH, mm, ss, SSS] = (
      [
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds(),
      ]
        .map((num) => num.toString())
        .map((str, i) => str.padStart(i == 3 ? 3 : 2, "0"))
    );

    return `${HH}:${mm}:${ss}.${SSS}`;
  }
}
