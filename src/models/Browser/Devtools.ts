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

export default interface Devtools {

  /**
   * Interact with the window that Developer tools are attached to (inspected window).
   * This includes obtaining the tab ID for the inspected page, evaluate the code
   * in the context of the inspected window, reload the page, or obtain the list of resources within the page.
   */
  inspectedWindow: Window;

  /**
   * Obtain information about network requests associated with the window that
   * the Developer Tools are attached to (the inspected window).
   */
  network: any;

  /**
   * Create User Interface panels that will be displayed inside User Agent Developer Tools.
   */
  panels: {
    create: (title: string, iconPath: string, pagePath: string) => Promise<ExtensionPanel>;
  };
}

export interface ExtensionPanel {
  onShown:  {
    addListener:    (listener: () => void) => void;
    removeListener: (listener: () => void) => void;
  };

  onHidden: {
    addListener:    (listener: () => void) => void;
    removeListener: (listener: () => void) => void;
  };
}
