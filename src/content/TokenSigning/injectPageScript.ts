// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import pageScript from "../../shared/TokenSigningPageScript";

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
  if (document.contentType !== "text/html" && document.contentType !== "application/xhtml+xml") {
    return;
  }
  if (!document.querySelector("script[data-name='TokenSigning']")) {
    const s = document.createElement("script");

    s.type = "text/javascript";
    if (s.dataset) {
      s.dataset.name = "TokenSigning";
      s.dataset.by = "Web-eID extension";
    } else {
      s.setAttribute("data-name", "TokenSigning");
      s.setAttribute("data-by", "Web-eID extension");
    }

    if (browser.runtime.getManifest()["manifest_version"] >= 3) {
      s.src = browser.runtime.getURL("token-signing-page-script.js");
    } else {
      s.innerHTML = "(" + pageScript + ")();";
    }

    (document.head || document.documentElement).appendChild(s);
  }
}
