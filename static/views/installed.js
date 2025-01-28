/*
 * Copyright (c) 2023-2025 Estonian Information System Authority
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

const title = document.getElementById("title");
title.innerText = browser.i18n.getMessage("title");

const content = document.getElementById("content");
content.innerHTML = browser.i18n.getMessage("content",
  "https://addons.mozilla.org/en-US/firefox/addon/web-eid-webextension/privacy/");

const agree = document.getElementById("agree");
agree.innerText = browser.i18n.getMessage("agree");
agree.addEventListener("click", () => {
  window.close();
});

const uninstall = document.getElementById("uninstall");
uninstall.innerText = browser.i18n.getMessage("uninstall");
uninstall.addEventListener("click", () => {
  browser.management.uninstallSelf({})
    .catch(() => {
      agree.innerText = "OK";
      uninstall.hidden = true;
      content.innerHTML = browser.i18n.getMessage("error");
    });
});
