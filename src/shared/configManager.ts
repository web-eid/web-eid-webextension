// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
      const values = await browser.storage.local.get(overrideableConfigKeys);

      for (const key of overrideableConfigKeys) {
        if (isValidConfigValue(key, values[key])) {
          setConfigValueOrResetToDefaultOnNull(key, values[key]);
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
