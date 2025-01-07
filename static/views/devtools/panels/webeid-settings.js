const excludedSettings = [
  "NATIVE_APP_NAME",
  "TOKEN_SIGNING_BACKWARDS_COMPATIBILITY",
];

const ui = {
  settingTemplate: document.querySelector("#setting-template"),
  settingsTable:   document.querySelector("section[data-page='settings'] #settings-list")
}

export default {
  render(config, defaultConfig, backgroundConnection) {
    Object.assign(this, { config, defaultConfig, backgroundConnection });
    
    const configRows = (
      Object
        .entries(config)
        .filter(([key]) => this.isVisible(key))
        .map(([key, value]) => this.createSettingRow(key, value))
    );

    ui.settingsTable.replaceChildren(...configRows);
  },

  isVisible(settingKey) {
    return !excludedSettings.includes(settingKey);
  },

  createSettingRow(key, value) {
    const row = ui.settingTemplate.content.cloneNode(true);

    const el = {
      key:   row.querySelector("th"),
      input: row.querySelector("input.value"),
      reset: row.querySelector("input.reset"),
    };

    el.key.innerText = key;

    this.updateInput(el.input, value);
    this.updateReset(el, key);

    const changeEvent = (
      el.input.type === "checkbox"
        ? "change"
        : "input"
    );

    el.input.addEventListener(changeEvent, () => {
      const value = ({
        "text":     el.input.value,
        "number":   el.input.valueAsNumber,
        "checkbox": el.input.checked
      })[el.input.type];

      this.backgroundConnection.postMessage({ devtools: 'setting-set', key, value });

      this.config[key] = value;
      this.updateReset(el, key);
    });

    el.reset.addEventListener("click", () => {
      this.config[key] = this.defaultConfig[key];
      el.reset.disabled = true;

      this.backgroundConnection.postMessage({
        devtools: 'setting-set',
        key,
        value: null,
      });

      this.updateInput(el.input, this.config[key]);
    });

    return row;
  },

  updateInput(input, value) {
    switch (typeof value) {
      case "number": {
        input.type  = "number";
        input.value = value;
        break;
      }
  
      case "boolean": {
        input.type = "checkbox";
        input.checked = value;
        break;
      }
    
      default:
        input.type  = "text";
        input.value = value;
        break;
    }
  },

  updateReset(el, key) {
    el.reset.disabled = (
      this.config[key] === this.defaultConfig[key]
    );
  }
}
