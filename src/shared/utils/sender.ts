// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import UnknownError from "@web-eid.js/errors/UnknownError";

import { MessageSender } from "../../models/Browser/Runtime";

/**
 * Returns the browser tab ID where the PostMessage API's message originated
 *
 * @param sender PostMessage API's message sender
 *
 * @returns Tab ID where the message originated
 * @throws UnknownError when the tab ID is not available
 */
export function getSenderTabId(sender: MessageSender): number {
  if (!sender.tab?.id || sender.tab?.id === browser.tabs.TAB_ID_NONE) {
    throw new UnknownError("invalid sender tab");
  }

  return sender.tab.id;
}

/**
 * Returns the URL where the PostMessage API's message originated
 *
 * @param sender PostMessage API's message sender
 * @returns
 */
export function getSenderUrl(sender: MessageSender): string {
  if (!sender.url) {
    throw new UnknownError("missing sender url");
  }

  return sender.url;
}
