// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Estonian Information System Authority

const ui = {
  devtools:          document.querySelector("#devtools"),
  storageNotAllowed: document.querySelector(".warning.storage-not-allowed"),
  openDevToolsAgain: document.querySelector(".warning.open-devtools-again"),

};

const devToolsEnabledStorageKey = "devtoolsEnabled";

(async () => {
  if (await isStorageEnabled()) {
    const { devtoolsEnabled } = await browser.storage.local.get([devToolsEnabledStorageKey]);

    ui.devtools.checked = Boolean(devtoolsEnabled);
  }
})();

ui.devtools.addEventListener("change", async () => {
  const hasStoragePermission = await ensureStorageCanBeUsed();

  if (!hasStoragePermission) {
    ui.storageNotAllowed.style.display = 'block';
  } else {
    ui.storageNotAllowed.style.display = 'none';

    await browser.storage.local.set({ [devToolsEnabledStorageKey]: ui.devtools.checked });

    ui.openDevToolsAgain.style.display = (
      ui.devtools.checked
        ? 'block'
        : 'none'
    );
  }
});

async function isStorageEnabled() {
  return isStorageDeclaredAsRequiredPermission() || (
    canRequestStoragePermission() &&
    await browser.permissions.contains({ permissions: ["storage"] })
  );
}

async function ensureStorageCanBeUsed() {
  if (isStorageDeclaredAsRequiredPermission()) {
    return true;
  }

  if (canRequestStoragePermission()) {
    return await browser.permissions.request({
      permissions: ["storage"]
    });
  }

  return false;
}

function isStorageDeclaredAsRequiredPermission() {
  return Boolean(browser.runtime.getManifest().permissions?.includes("storage"));
}

function canRequestStoragePermission() {
  return Boolean(browser.runtime.getManifest().optional_permissions?.includes("storage"));
}
