async function isDevToolsEnabled() {
  const isDevToolsOptional = Boolean(browser.runtime.getManifest().optional_permissions?.includes("devtools"));

  if (isDevToolsOptional) {
    return true;
  }

  const isStorageOptional    = Boolean(browser.runtime.getManifest().optional_permissions?.includes("storage"));
  const hasStoragePermission = await browser.permissions.contains({ permissions: ["storage"] });

  if (isStorageOptional && hasStoragePermission) {
    const { devtoolsEnabled } = await browser.storage.local.get(["devtoolsEnabled"]);

    return Boolean(devtoolsEnabled);
  }

  return false;
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
