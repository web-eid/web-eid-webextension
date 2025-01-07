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
