// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
}
