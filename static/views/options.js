/*
 * Copyright (c) 2024-2025 Estonian Information System Authority
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

const ui = {
  devtools:          document.querySelector("#devtools"),
  storageNotAllowed: document.querySelector(".warning.storage-not-allowed"),
  openDevToolsAgain: document.querySelector(".warning.open-devtools-again"),

};

(async () => {
  if (await browser.permissions.contains({ permissions: ["storage"] })) {
    const { devtoolsEnabled } = await browser.storage.local.get(["devtoolsEnabled"]);
  
    ui.devtools.checked = Boolean(devtoolsEnabled);
  }
})();

ui.devtools.addEventListener("change", async () => {
  const hasStoragePermission = await browser.permissions.request({
    permissions: ["storage"]
  });

  if (!hasStoragePermission) {
    ui.storageNotAllowed.style.display = 'block';
  } else {
    ui.storageNotAllowed.style.display = 'none';

    browser.storage.local.set({ devtoolsEnabled: ui.devtools.checked });

    ui.openDevToolsAgain.style.display = (
      ui.devtools.checked
        ? 'block'
        : 'none'
    );
  }
});
