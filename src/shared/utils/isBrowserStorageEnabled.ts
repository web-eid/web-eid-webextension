// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

/**
 * Function to check if saving to browser storage is allowed
 *
 * @returns true if manifest optional_permissions includes storage and storage permission is given by user
 */
export default async function isBrowserStorageEnabled() {
  const isStorageOptional = Boolean(browser.runtime.getManifest().optional_permissions?.includes("storage"));
  const hasStoragePermission = await browser.permissions.contains({ permissions: ["storage"] });
  return isStorageOptional && hasStoragePermission;
}
