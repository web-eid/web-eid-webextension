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

import pageScript from "./pageScript";

export default function injectPageScript(): void {
  /**
 * Check the page for an existing TokenSigning page script.
 * The script will be injected to the DOM of every page, which doesn't already have the script.
 * To circumvent Content Security Policy issues, the website can include the script on its own.
 *
 * Example:
 *   <script src="path-to/page.js" data-name="TokenSigning"></script>
 *
 * The page script can be found here:
 *   https://github.com/open-eid/chrome-token-signing/blob/master/extension/page.js
 */
  if (!document.querySelector("script[data-name='TokenSigning']")) {
    const s = document.createElement("script");

    s.type = "text/javascript";
    s.dataset.name = "TokenSigning";
    s.dataset.by = "Web-eID extension";
    s.innerHTML = "(" + pageScript + ")();";

    (document.head || document.documentElement).appendChild(s);
  }
}
