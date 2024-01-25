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
