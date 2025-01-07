// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
