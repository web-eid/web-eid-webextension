/*
 * Copyright (c) 2024-2025 Estonian Information System Authority
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const excludedSettings = [
  "NATIVE_APP_NAME",
  "VERSION",
  "TOKEN_SIGNING_BACKWARDS_COMPATIBILITY"
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
