/*
 * Copyright (c) 2020-2024 Estonian Information System Authority
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

import NativeUnavailableError from "@web-eid.js/errors/NativeUnavailableError";
import { deserializeError } from "@web-eid.js/utils/errorSerializer";
import libraryConfig from "@web-eid.js/config";

import { NativeRequest } from "@web-eid.js/models/message/NativeRequest";
import { Port } from "../../models/Browser/Runtime";
import calculateJsonSize from "../../shared/utils/calculateJsonSize";
import config from "../../config";

export enum NativeAppState {
  UNINITIALIZED,
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
}

export default class NativeAppService {
  public state: NativeAppState = NativeAppState.UNINITIALIZED;

  private port: Port | null = null;

  async connect(): Promise<{ version: string }> {
    this.state = NativeAppState.CONNECTING;
    this.port  = browser.runtime.connectNative(config.NATIVE_APP_NAME);

    this.port.onDisconnect.addListener(this.disconnectListener.bind(this));

    try {
      const message = await this.nextMessage(
        libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT,
        new NativeUnavailableError(
          `native application handshake timeout, ${libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT}ms`
        ),
      );

      if (message.version) {
        this.state = NativeAppState.CONNECTED;

        return message;
      }

      if (message) {
        throw new NativeUnavailableError(
          `expected native application to reply with a version, got ${JSON.stringify(message)}`
        );
      } else if (this.port.error) {
        throw new NativeUnavailableError(this.port.error.message);
      } else {
        throw new NativeUnavailableError("unexpected error");
      }
    } catch (error) {
      if (this.port.error) {
        console.error(this.port.error);
      }

      if (error instanceof Error) {
        throw error;
      } else if (this.port.error?.message) {
        throw new NativeUnavailableError(this.port.error.message);
      } else {
        throw new NativeUnavailableError("unexpected error");
      }
    }
  }

  disconnectListener(): void {
    config.DEBUG && console.log("Native app disconnected.");

    // Accessing lastError when it exists stops chrome from throwing it unnecessarily.
    chrome?.runtime?.lastError;

    this.state = NativeAppState.DISCONNECTED;
  }

  close(): void {
    if (this.state == NativeAppState.DISCONNECTED) return;

    this.state = NativeAppState.DISCONNECTED;
    this.port?.disconnect();

    config.DEBUG && console.log("Native app port closed by extension.");
  }

  async send<T>(message: NativeRequest, timeout: number, throwAfterTimeout: Error): Promise<T> {
    switch (this.state) {
      case NativeAppState.CONNECTED: {
        config.DEBUG && console.log("Sending message to native app", JSON.stringify(message));

        const messageSize = calculateJsonSize(message);

        if (messageSize > config.NATIVE_MESSAGE_MAX_BYTES) {
          throw new Error(`native application message exceeded ${config.NATIVE_MESSAGE_MAX_BYTES} bytes`);
        }

        this.port?.postMessage(message);

        try {
          const response = await this.nextMessage(timeout, throwAfterTimeout);

          this.close();

          return response;
        } catch (error) {
          console.error(error);

          this.close();

          throw error;
        }
      }

      case NativeAppState.UNINITIALIZED: {
        return Promise.reject(
          new Error("unable to send message, native application port is not initialized yet")
        );
      }

      case NativeAppState.CONNECTING: {
        return Promise.reject(
          new Error("unable to send message, native application port is still connecting")
        );
      }

      case NativeAppState.DISCONNECTED: {
        return Promise.reject(
          new Error("unable to send message, native application port is disconnected")
        );
      }

      default: {
        return Promise.reject(
          new Error("unable to send message, unexpected native app state")
        );
      }
    }
  }

  nextMessage(timeout: number, throwAfterTimeout: Error): Promise<any> {
    return new Promise((resolve, reject) => {
      let cleanup: (() => void) | null = null;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const onMessageListener = (message: any): void => {
        cleanup?.();
        if (message.error) {
          reject(deserializeError(message.error));
        } else {
          resolve(message);
        }
      };

      const onDisconnectListener = (): void => {
        cleanup?.();
        reject(new NativeUnavailableError(
          "a message from native application was expected, but native application closed connection"
        ));
      };

      cleanup = (): void => {
        this.port?.onDisconnect.removeListener(onDisconnectListener);
        this.port?.onMessage.removeListener(onMessageListener);
        if (timer) clearTimeout(timer);
      };

      timer = setTimeout(
        () => {
          cleanup?.();
          reject(throwAfterTimeout);
        },
        timeout,
      );

      if (!this.port) {
        return reject(new NativeUnavailableError("missing native application port"));
      }

      this.port.onDisconnect.addListener(onDisconnectListener);
      this.port.onMessage.addListener(onMessageListener);
    });
  }
}
