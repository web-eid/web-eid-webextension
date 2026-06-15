/*
 * Copyright (c) 2020-2026 Estonian Information System Authority
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

import ErrorCode from "@web-eid.js/errors/ErrorCode";
import NativeUnavailableError from "@web-eid.js/errors/NativeUnavailableError";
import libraryConfig from "@web-eid.js/config";

import { NativeRequest } from "@web-eid.js/models/message/NativeRequest";
import NativeAppService, { NativeAppState } from "../NativeAppService";
import config from "../../../config";

type MessageListener = (message: object) => void;
type DisconnectListener = () => void;

class ListenerCollection<TListener extends (...args: Array<never>) => void> {
  private listeners = new Set<TListener>();

  addListener = jest.fn((listener: TListener) => {
    this.listeners.add(listener);
  });

  removeListener = jest.fn((listener: TListener) => {
    this.listeners.delete(listener);
  });

  emit(...args: Parameters<TListener>): void {
    this.listeners.forEach((listener) => listener(...args));
  }
}

class MockNativePort {
  name = "eu.webeid";
  error = undefined as unknown as Error;
  disconnect = jest.fn();
  onDisconnect = new ListenerCollection<DisconnectListener>();
  onMessage = new ListenerCollection<MessageListener>();
  postMessage = jest.fn();

  emitMessage(message: object): void {
    this.onMessage.emit(message);
  }

  emitDisconnect(): void {
    this.onDisconnect.emit();
  }
}

function installBrowserMock(port: MockNativePort): jest.Mock {
  const connectNative = jest.fn(() => port);

  Object.defineProperty(globalThis, "browser", {
    configurable: true,
    value: {
      runtime: {
        connectNative,
      },
    },
  });

  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: {
      runtime: {},
    },
  });

  return connectNative;
}

function emitHandshake(port: MockNativePort, version = "2.4.1"): void {
  port.emitMessage({ version });
}

describe("NativeAppService native messaging IPC", () => {
  let port: MockNativePort;
  let connectNative: jest.Mock;
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    port = new MockNativePort();
    connectNative = installBrowserMock(port);
    consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("connects to the configured native host and resolves the version handshake", async () => {
    const nativeAppService = new NativeAppService();

    const connected = nativeAppService.connect();
    emitHandshake(port, "2.9.0+0");

    await expect(connected).resolves.toEqual({ version: "2.9.0+0" });
    expect(connectNative).toHaveBeenCalledWith(config.NATIVE_APP_NAME);
    expect(nativeAppService.state).toBe(NativeAppState.CONNECTED);
  });

  it("rejects when the handshake response is not a version object", async () => {
    const nativeAppService = new NativeAppService();

    const connected = nativeAppService.connect();
    port.emitMessage({ unexpected: "response" });

    await expect(connected).rejects.toMatchObject({
      code:    ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE,
      message: "expected native application to reply with a version, got {\"unexpected\":\"response\"}",
    });
  });

  it("rejects when the native app closes before the handshake response", async () => {
    const nativeAppService = new NativeAppService();

    const connected = nativeAppService.connect();
    port.emitDisconnect();

    await expect(connected).rejects.toMatchObject({
      code:    ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE,
      message: "a message from native application was expected, but native application closed connection",
    });
  });

  it("rejects on native app handshake timeout", async () => {
    jest.useFakeTimers();

    const nativeAppService = new NativeAppService();
    const connected = nativeAppService.connect();

    jest.advanceTimersByTime(libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT);

    await expect(connected).rejects.toMatchObject({
      code:    ErrorCode.ERR_WEBEID_NATIVE_UNAVAILABLE,
      message: `native application handshake timeout, ${libraryConfig.NATIVE_APP_HANDSHAKE_TIMEOUT}ms`,
    });
  });

  it("posts a command request and resolves the native response", async () => {
    const nativeAppService = new NativeAppService();
    const connected = nativeAppService.connect();
    emitHandshake(port);
    await connected;

    const request: NativeRequest = {
      command:   "quit",
      arguments: {},
    };

    const sent = nativeAppService.send(request, 1000, new Error("timeout"));
    port.emitMessage({});

    await expect(sent).resolves.toEqual({});
    expect(port.postMessage).toHaveBeenCalledWith(request);
    expect(port.disconnect).toHaveBeenCalledTimes(1);
    expect(nativeAppService.state).toBe(NativeAppState.DISCONNECTED);
  });

  it("deserializes native error responses", async () => {
    const nativeAppService = new NativeAppService();
    const connected = nativeAppService.connect();
    emitHandshake(port);
    await connected;

    const request: NativeRequest = {
      command:   "quit",
      arguments: {},
    };

    const sent = nativeAppService.send(request, 1000, new Error("timeout"));
    port.emitMessage({
      error: {
        code:    ErrorCode.ERR_WEBEID_NATIVE_FATAL,
        message: "Technical error, see application logs",
      },
    });

    await expect(sent).rejects.toMatchObject({
      code:    ErrorCode.ERR_WEBEID_NATIVE_FATAL,
      message: "Technical error, see application logs",
      name:    "NativeFatalError",
    });
    expect(port.disconnect).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalled();
  });

  it("rejects and closes the port when a command times out", async () => {
    jest.useFakeTimers();

    const nativeAppService = new NativeAppService();
    const connected = nativeAppService.connect();
    emitHandshake(port);
    await connected;

    const timeoutError = new NativeUnavailableError("native app did not answer");
    const sent = nativeAppService.send(
      { command: "quit", arguments: {} },
      250,
      timeoutError
    );

    jest.advanceTimersByTime(250);

    await expect(sent).rejects.toBe(timeoutError);
    expect(port.disconnect).toHaveBeenCalledTimes(1);
  });

  it("rejects without posting when the native command exceeds the message size limit", async () => {
    const nativeAppService = new NativeAppService();
    const connected = nativeAppService.connect();
    emitHandshake(port);
    await connected;

    const request: NativeRequest = {
      command: "sign",
      arguments: {
        certificate: "certificate",
        hash:        "x".repeat(config.NATIVE_MESSAGE_MAX_BYTES),
        hashFunction: "SHA-384",
        origin:      "https://example.com",
      },
    };

    await expect(nativeAppService.send(request, 1000, new Error("timeout"))).rejects.toThrow(
      `native application message exceeded ${config.NATIVE_MESSAGE_MAX_BYTES} bytes`
    );
    expect(port.postMessage).not.toHaveBeenCalled();
    expect(port.disconnect).toHaveBeenCalledTimes(1);
  });
});
