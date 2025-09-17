/*
 * Copyright (c) 2020-2025 Estonian Information System Authority
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

import defaultConfig from "../config";
import isBrowserStorageEnabled from "./utils/isBrowserStorageEnabled";

type Config = {
  -readonly [key in keyof typeof defaultConfig]: typeof defaultConfig[key];
};

const config = JSON.parse(JSON.stringify(defaultConfig)) as Config;

const overrideableConfigKeys: Array<keyof typeof defaultConfig> = [
  "NATIVE_MESSAGE_MAX_BYTES",
  "NATIVE_GRACEFUL_DISCONNECT_TIMEOUT",
  "TOKEN_SIGNING_USER_INTERACTION_TIMEOUT",
  "ALLOW_HTTP_LOCALHOST"
];

async function setConfigOverride<K extends keyof typeof defaultConfig>(key: K, value: typeof defaultConfig[K] | null) {
  if (!overrideableConfigKeys.includes(key)) {
    return;
  }
  setConfigValueOrResetToDefaultOnNull(key, value);
  await saveToStorageOrRemoveOnNull(key, value);
}

async function loadConfigFromStorage() {
  const isStorageEnabled = await isBrowserStorageEnabled();
  if (isStorageEnabled) {
    try {
      const results = await browser.storage.local.get(overrideableConfigKeys);

      for (const key of overrideableConfigKeys) {
        if (isValidConfigValue(key, results[key])) {
          setConfigValueOrResetToDefaultOnNull(key, results[key]);
        }
      }
    } catch (error) {
      console.error("Failed to load configuration from storage:", error);
    }
  }
}

function isValidConfigValue<K extends keyof typeof defaultConfig>(key: K, value: unknown): value is typeof defaultConfig[K] {
  return typeof value === typeof defaultConfig[key];
}

function setConfigValueOrResetToDefaultOnNull<K extends keyof typeof defaultConfig>(key: K, value: typeof defaultConfig[K] | null) {
  if (value === null) {
    config[key] = defaultConfig[key];
  } else {
    config[key] = value;
  }
}

async function saveToStorageOrRemoveOnNull<K extends keyof typeof defaultConfig>(key: K, value: typeof defaultConfig[K] | null) {
  const isStorageEnabled = await isBrowserStorageEnabled();
  if (isStorageEnabled) {
    if (value === null || value === defaultConfig[key]) {
      await browser.storage.local.remove([key]);
    } else {
      await browser.storage.local.set({ [key]: value });
    }
  }
}

export {
  config,
  defaultConfig,
  loadConfigFromStorage,
  setConfigOverride,
};
