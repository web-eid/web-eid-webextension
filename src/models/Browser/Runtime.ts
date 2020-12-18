/*
 * Copyright (c) 2020 The Web eID Project
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

export default interface Runtime {
  onMessage: {
    addListener: (callback: OnMessageCallback) => void;
  };

  /**
   * Sends a single message from an extension to a native application.
   *
   * This takes two mandatory parameters: the name of the native application and a JSON object which is
   * the message to send it. The browser will launch the native application and deliver the message.
   *
   * This is an asynchronous function that returns a `Promise`.
   * The first message sent by the native application is treated as a response to the `sendNativeMessage()` call,
   * and the promise will be fulfilled with this message as a parameter.
   * Note that you can't use `runtime.onMessage` to get responses from the application,
   * you must use the callback function instead.
   *
   * A new instance of the application is launched for call to `runtime.sendNativeMessage()`.
   * The browser will terminate the native application after getting a reply.
   * To terminate a native application, the browser will close the pipe,
   * give the process a few seconds to exit gracefully, and then kill it if it has not exited.
   *
   * @param application The name of the native application.
   *                    This must match the "name" property in the native application's manifest file.
   *
   * @param message A JSON object that will be sent to the native application.
   *
   * @returns A Promise. If the sender sent a response, this will be fulfilled with the response as a JSON object.
   *          Otherwise it will be fulfilled with no arguments. If an error occurs while connecting to
   *          the native application, the promise will be rejected with an error message.
   */
  sendNativeMessage: (
    application: string,
    message: object,
    callback?: (message: any) => void
  ) => Promise<object | void>;

  /**
   * Sends a single message to event listeners within your extension or a different extension.
   *
   * If sending to your extension, omit the extensionId argument. The `runtime.onMessage` event will be fired
   * in each page in your extension, except for the frame that called runtime.sendMessage.
   *
   * If sending to a different extension, include the extensionId argument set to the other extension's ID. runtime.onMessageExternal will be fired in the other extension.
   *
   * Extensions cannot send messages to content scripts using this method.
   *
   * This is an asynchronous function that returns a Promise.
   *
   * @param message An object that can be structured clone serialized.
   *
   * @param options.includeTlsChannelId Whether the TLS channel ID will be passed into `runtime.onMessageExternal`
   *                                    for processes that are listening for the connection event.
   *
   * @param options.toProxyScript Must be `true` if the message is intended for
   *                              a PAC file loaded using the proxy API.
   */
  sendMessage: (
    message: object,
    options?: {
      includeTlsChannelId?: boolean;
      toProxyScript?: boolean;
    }
  ) => Promise<object | void>;

  connectNative: (application: string) => Port;
}

export interface Port {
  name: string;
  disconnect: () => void;
  error: Error;
  onDisconnect: {
    addListener:    (listener: Function) => void;
    removeListener: (listener: Function) => void;
  };
  onMessage: {
    addListener:    (listener: Function) => void;
    removeListener: (listener: Function) => void;
  };
  postMessage: (message: object) => void;

  sender?: any;
}

export type OnMessageCallback = (message: any, sender: MessageSender, sendResponse?: any) => Promise<any> | void | boolean;

export interface MessageSender {
  /**
   * The `Tab` which opened the connection.
   * This property will only be present when the connection was opened from a tab (including content scripts).
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/Tab
   */
  tab?: object;

  /**
   * The frame that opened the connection.
   * Zero for top-level frames, positive for child frames. This will only be set when `tab` is set.
   */
  frameId?: number;

  /**
   * The ID of the extension that sent the message, if the message was sent by an extension.
   * If the sender set an ID explicitly using the applications key in manifest.json, then `id` will have this value.
   * Otherwise it will have the ID that was generated for the sender.
   */
  id?: string;

  /**
   * The URL of the page or frame hosting the script that sent the message.
   */
  url?: string;

  /**
   * The TLS channel ID of the page or frame that opened the connection,
   * if requested by the extension, and if available.
   */
  tlsChannelId?: string;
}
