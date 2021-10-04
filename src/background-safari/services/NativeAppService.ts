/*
 * Copyright (c) 2020-2021 Estonian Information System Authority
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

import NativeUnavailableError from "@web-eid/web-eid-library/errors/NativeUnavailableError";
import libraryConfig from "@web-eid/web-eid-library/config";
import { deserializeError } from "@web-eid/web-eid-library/utils/errorSerializer";

import config from "../../config";
import Mutex from "../../shared/Mutex";
import { objectByteSize } from "../../shared/utils";
import { NativeAppMessage } from "../../models/NativeAppMessage";

type NativeAppPendingRequest = { reject?: Function; resolve?: Function } | null;

export enum NativeAppState {
  UNINITIALIZED,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

const commandMutex = new Mutex();

export default class NativeAppService {
  public state: NativeAppState = NativeAppState.UNINITIALIZED;

  private pending: NativeAppPendingRequest = null;

  async connect(): Promise<{ version: string }> {
    this.state = NativeAppState.CONNECTING;

    try {
      const message = await new Promise<{ version: string }>((resolve, reject) => {
        setTimeout(reject, libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT);

        browser.runtime.sendNativeMessage(
          "application.id",
          { command: "status" },
          (response) => resolve(response)
        );
      });

      if (message.version) {
        this.state = NativeAppState.CONNECTED;

        return message;
      }

      if (message) {
        throw new NativeUnavailableError(
          `expected native application to reply with a version, got ${JSON.stringify(message)}`
        );
      } else {
        throw new NativeUnavailableError("unexpected error");
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new NativeUnavailableError("unexpected error");
      }
    }
  }

  close(error?: any): void {
    console.log("Disconnecting from native app");
    this.state = NativeAppState.DISCONNECTED;

    this.pending?.reject?.(error);
    this.pending = null;
  }

  async send<T extends any>(message: NativeAppMessage): Promise<T> {
    if (message.command == "quit") return {} as T;

    switch (this.state) {
      case NativeAppState.CONNECTED: {
        const releaseLock: Function = await commandMutex.acquire();

        const sendPromise = new Promise<T>((resolve, reject) => {
          this.pending = { resolve, reject };

          const onResponse = (message: any): void => {
            this.pending = null;

            if (message.error) {
              reject(deserializeError(message.error));
            } else {
              resolve(message);
            }
          };

          console.log("Sending message to native app", JSON.stringify(message));

          const messageSize = objectByteSize(message);

          if (messageSize > config.NATIVE_MESSAGE_MAX_BYTES) {
            throw new Error(`native application message exceeded ${config.NATIVE_MESSAGE_MAX_BYTES} bytes`);
          }

          browser.runtime.sendNativeMessage("application.id", message, onResponse);
        });

        return sendPromise.finally(() => releaseLock());
      }

      case NativeAppState.UNINITIALIZED: {
        return Promise.reject(
          new NativeUnavailableError("unable to send message, native application port is not initialized yet")
        );
      }

      case NativeAppState.CONNECTING: {
        return Promise.reject(
          new NativeUnavailableError("unable to send message, native application port is still connecting")
        );
      }

      case NativeAppState.DISCONNECTED: {
        return Promise.reject(
          new NativeUnavailableError("unable to send message, native application port is disconnected")
        );
      }

      default: {
        return Promise.reject(
          new NativeUnavailableError("unable to send message, unexpected native app state")
        );
      }
    }
  }
}
