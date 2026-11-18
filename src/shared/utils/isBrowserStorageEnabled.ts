// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

/**
 * Function to check if saving to browser storage is allowed
 *
 * @returns true if storage is a required permission, or if optional storage has been granted by the user
 */
export default async function isBrowserStorageEnabled() {
  const manifest                                = browser.runtime.getManifest();
  const isStorageDeclaredAsRequiredPermission   = Boolean(manifest.permissions?.includes("storage"));

  if (isStorageDeclaredAsRequiredPermission) {
    return true;
  }

  const canRequestStoragePermission = Boolean(manifest.optional_permissions?.includes("storage"));

  if (canRequestStoragePermission) {
    return await browser.permissions.contains({ permissions: ["storage"] });
  }

  return false;
}
