// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

export default interface ExtensionStorage {

  /**
   * Represents the local storage area. Items in local storage are local to the machine the extension was installed on.
   */
  local: StorageArea;

  /**
   * Represents the managed storage area. Items in managed storage are set by the domain administrator and
   * are read-only for the extension. Trying to modify this namespace results in an error.
   */
  managed: StorageArea;

  /**
   * Represents the session storage area. Items in session storage are stored in memory and are not persisted to disk.
   */
  session: StorageArea;

  /**
   * Represents the sync storage area. Items in sync storage are synced by the browser,
   * and are available across all instances of that browser that the user is logged into, across different devices.
   */
  sync: StorageArea;
}

export interface StorageArea {
  /**
   * Retrieves one or more items from the storage area.
   */
  get: (keys: null | string | object | Array<string>) => Promise<Record<string, any>>;

  /**
   * Gets the amount of storage space (in bytes) used for one or more items in the storage area.
   */
  getBytesInUse: (keys: null | string | Array<string>) => Promise<number>;
  /**
   * Stores one or more items in the storage area. If the item exists, its value is updated.
   */
  set: (data: Record<string, any>) => Promise<void>;
  /**
   * Removes one or more items from the storage area.
   */
  remove: (keys: string | Array<string>) => Promise<void>;
  /**
   * Removes all items from the storage area.
   */
  clear: () => Promise<void>;
}
