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

import { NativeRequest } from "@web-eid.js/models/message/NativeRequest";
import NativeUnavailableError from "@web-eid.js/errors/NativeUnavailableError";
import { deserializeError } from "@web-eid.js/utils/errorSerializer";
import libraryConfig from "@web-eid.js/config";

import Mutex from "../../shared/Mutex";
import calculateJsonSize from "../../shared/utils/calculateJsonSize";
import { config } from "../../shared/configManager";

import Logger from "../../shared/Logger";

const logger = new Logger("NativeAppService.ts");

type NativeAppPendingRequest =
  | { resolve?: (value: PromiseLike<any>) => void; reject?: (reason?: any) => void }
  | null;

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

  constructor(tabId?: number) {
    logger.tabId = tabId;
  }

  async connect(): Promise<{ version: string }> {
    logger.log("Connecting to the native application " + config.NATIVE_APP_NAME);

    this.state = NativeAppState.CONNECTING;

    try {
      const message = await new Promise<{ version: string }>((resolve, reject) => {
        setTimeout(
          () => {
            reject(new NativeUnavailableError(
              `native application handshake timeout, ${libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT}ms`
            ));
          },
          libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT,
        );

        browser.runtime.sendNativeMessage(
          "application.id",
          { command: "status" },
          (response) => resolve(response),
        );
      });

      if (message.version) {
        this.state = NativeAppState.CONNECTED;

        logger.info("Connected to the native application", message);

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
    logger.info("Closing connection to native application");

    this.state = NativeAppState.DISCONNECTED;

    this.pending?.reject?.(error);
    this.pending = null;
  }

  async send<T>(message: NativeRequest, timeout: number, throwAfterTimeout: Error): Promise<T> {
    if (message.command == "quit") return {} as T;

    switch (this.state) {
      case NativeAppState.CONNECTED: {
        const releaseLock = await commandMutex.acquire();

        const sendPromise = new Promise<T>((resolve, reject) => {
          this.pending = { resolve, reject };

          setTimeout(() => { reject(throwAfterTimeout); }, timeout );

          const onResponse = (message: any): void => {
            logger.log("Response from native application", message);

            this.pending = null;

            if (message.error) {
              reject(deserializeError(message.error));
            } else {
              resolve(message);
            }
          };

          const messageSize = calculateJsonSize(message);

          logger.info("Calculated message size", messageSize);

          if (messageSize > config.NATIVE_MESSAGE_MAX_BYTES) {
            throw new Error(`native application message exceeded ${config.NATIVE_MESSAGE_MAX_BYTES} bytes`);
          }
          logger.log("Sending message to native application", message);

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
