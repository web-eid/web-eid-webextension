// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

/**
 * Function to check if saving to browser storage is allowed
 *
 * @returns true if storage is a required permission, or if optional storage has been granted by the user
 */
export default async function isBrowserStorageEnabled() {
  const manifest          = browser.runtime.getManifest();
  const isStorageRequired = Boolean(manifest.permissions?.includes("storage"));

  if (isStorageRequired) {
    return true;
  }

  const isStorageOptional = Boolean(manifest.optional_permissions?.includes("storage"));

  if (!isStorageOptional) {
    return false;
  }

  const hasStoragePermission = await browser.permissions.contains({ permissions: ["storage"] });
  return hasStoragePermission;
}
