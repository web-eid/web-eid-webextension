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

import Devtools from "./Browser/Devtools";
import Permissions from "./Browser/Permissions";
import Runtime from "./Browser/Runtime";
import Tabs from "./Browser/Tabs";

declare global {
  const browser: Browser;
  const chrome: any;
}

export default interface Browser {
  /**
   * This module provides information about your extension and the environment it's running in.
   *
   * It also provides messaging APIs enabling you to:
   * - Communicate between different parts of your extension.
   *   For advice on choosing between the messaging options,
   *   see Choosing between one-off messages and connection-based messaging.
   * - Communicate with other extensions.
   * - Communicate with native applications.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime
   */
  runtime: Runtime;

  /**
   * Enables discovering current extension permissions and the ability to add or remove permissions during runtime.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions
   */
  permissions: Permissions;

  /**
   * Interact with the browser's tab system.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs
   */
  tabs: Tabs;

  /**
   * Enables extensions to interact with the browser's Developer Tools.
   * 
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/devtools
   */
  devtools: Devtools;

  /**
   * 
   */
  storage: Storage;
}
