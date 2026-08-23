// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Estonian Information System Authority

async function isDevToolsEnabled() {
  return isOptionalPermissionDevToolsEnabled() || await isOptionsPageDevToolsToggleEnabled();
}

(async () => {
  if (await isDevToolsEnabled()) {
    browser.devtools.panels.create(
      "Web eID",
      "/icons/web-eid-icon-128.png",
      "/views/devtools/panels/devtools-webeid.html",
    );
  }
})();

function isOptionalPermissionDevToolsEnabled() {
  return Boolean(browser.runtime.getManifest().optional_permissions?.includes("devtools"));
}

async function isOptionsPageDevToolsToggleEnabled() {
  if(browser.runtime.getURL('').startsWith('safari-web-extension://')) {
    return isOptionsPageDevToolsToggleEnabledInSafari();
  }

  const isStorageEnabled = await isBrowserStorageEnabled();
  if (isStorageEnabled) {
    const { devtoolsEnabled } = await browser.storage.local.get(["devtoolsEnabled"]);

    return Boolean(devtoolsEnabled);
  }

  return false;
}

async function isBrowserStorageEnabled() {
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

async function isOptionsPageDevToolsToggleEnabledInSafari() {
  try {
    const { devtoolsEnabled } = await browser.storage.local.get(["devtoolsEnabled"]);

    return Boolean(devtoolsEnabled);
  } catch {
    return false;
  }
}

