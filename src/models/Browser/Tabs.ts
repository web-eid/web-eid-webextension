// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

export type CreateProperties = {
  active?: boolean,
  index?: number,
  openerTabId?: number,
  pinned?: boolean,
  selected?: boolean,
  url?: string,
  windowId?: number,
};

export type CreateCallback = (tab: object /* Tab */) => void;

export default interface Tabs {

  /**
   * A special ID value given to tabs that are not browser tabs (for example, tabs in devtools windows).
   */
  TAB_ID_NONE: number;

  /**
   * Creates a new tab.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create
   */
  create: (
    createProperties: CreateProperties,
    callback?: CreateCallback
  ) => Promise<object /* Tab */>;

  /**
   * Sends a single message from the extension's background scripts (or other privileged scripts,
   * such as popup scripts or options page scripts) to any content scripts or extension pages/iframes
   * that belong to the extension and are running in the specified tab.
   *
   * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/sendMessage
   */
  sendMessage: (
    tabId: number,
    message: object,
    options?: {
      frameId: number;
    }
  ) => Promise<object | void>;
}
