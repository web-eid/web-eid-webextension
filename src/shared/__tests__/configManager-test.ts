// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import {config, setConfigOverride} from "../configManager";

const mockStorageLocal = {
  set: jest.fn(),
  remove: jest.fn()
};

const mockBrowser = {
  storage: {
    local: mockStorageLocal
  }
};

(global as any).browser = mockBrowser;

const mockIsBrowserStorageEnabled = jest.fn();

jest.mock("../utils/isBrowserStorageEnabled", () => ({
  __esModule: true,
  default: () => mockIsBrowserStorageEnabled()
}));

describe("setConfigOverride", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when storage is enabled", () => {
    beforeEach(() => {
      config.ALLOW_HTTP_LOCALHOST = false;
      mockIsBrowserStorageEnabled.mockResolvedValue(true);
    });

    it("should set value in config and storage when value is not null", async () => {
      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);

      await setConfigOverride("ALLOW_HTTP_LOCALHOST", true);

      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(true);
      expect(mockStorageLocal.set).toHaveBeenCalledWith({ALLOW_HTTP_LOCALHOST: true});
      expect(mockStorageLocal.remove).not.toHaveBeenCalled();
    });

    it("should set config value to default and remove key from storage when value is null", async () => {
      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);

      await setConfigOverride("ALLOW_HTTP_LOCALHOST", null);

      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);
      expect(mockStorageLocal.remove).toHaveBeenCalledWith(["ALLOW_HTTP_LOCALHOST"]);
      expect(mockStorageLocal.set).not.toHaveBeenCalled();
    });

    it("should set config value to default and remove key from storage when value is equal to default value", async () => {
      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);

      await setConfigOverride("ALLOW_HTTP_LOCALHOST", false);

      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);
      expect(mockStorageLocal.remove).toHaveBeenCalledWith(["ALLOW_HTTP_LOCALHOST"]);
      expect(mockStorageLocal.set).not.toHaveBeenCalled();
    });

    it("should not set non overridable config value", async () => {
      expect(config.NATIVE_APP_NAME).toEqual("eu.webeid");

      await setConfigOverride("NATIVE_APP_NAME", null);

      expect(config.NATIVE_APP_NAME).toEqual("eu.webeid");
      expect(mockStorageLocal.remove).not.toHaveBeenCalledWith(["NATIVE_APP_NAME"]);
      expect(mockStorageLocal.set).not.toHaveBeenCalled();
    });

  });

  describe("when storage is disabled", () => {
    beforeEach(() => {
      config.ALLOW_HTTP_LOCALHOST = false;
      mockIsBrowserStorageEnabled.mockResolvedValue(false);
    });

    it("should set value in config and not call storage methods when storage is disabled", async () => {
      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);

      await setConfigOverride("ALLOW_HTTP_LOCALHOST", true);

      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(true);
      expect(mockStorageLocal.set).not.toHaveBeenCalled();
      expect(mockStorageLocal.remove).not.toHaveBeenCalled();
    });

    it("should set config value to default and not call storage methods when storage is disabled", async () => {
      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);

      await setConfigOverride("ALLOW_HTTP_LOCALHOST", null);

      expect(config.ALLOW_HTTP_LOCALHOST).toEqual(false);
      expect(mockStorageLocal.set).not.toHaveBeenCalled();
      expect(mockStorageLocal.remove).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockIsBrowserStorageEnabled.mockResolvedValue(true);
    });

    it("should handle storage.set errors", async () => {
      const error = new Error("Storage set failed");
      mockStorageLocal.set.mockRejectedValue(error);

      await expect(setConfigOverride("ALLOW_HTTP_LOCALHOST", true))
        .rejects.toThrow("Storage set failed");
    });

    it("should handle storage.remove errors", async () => {
      const error = new Error("Storage remove failed");
      mockStorageLocal.remove.mockRejectedValue(error);

      await expect(setConfigOverride("ALLOW_HTTP_LOCALHOST", null))
        .rejects.toThrow("Storage remove failed");
    });

    it("should handle isBrowserStorageEnabled errors", async () => {
      const error = new Error("Storage check failed");
      mockIsBrowserStorageEnabled.mockRejectedValue(error);

      await expect(setConfigOverride("ALLOW_HTTP_LOCALHOST", true))
        .rejects.toThrow("Storage check failed");
    });
  });
});
