// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import isBrowserStorageEnabled from "../isBrowserStorageEnabled";

const mockPermissionsContains = jest.fn();
const mockGetManifest = jest.fn();

(global as any).browser = {
  permissions: {
    contains: mockPermissionsContains,
  },
  runtime: {
    getManifest: mockGetManifest,
  },
};

describe("isBrowserStorageEnabled", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should return true when storage is a required permission", async () => {
    mockGetManifest.mockReturnValue({
      permissions: ["storage"],
    });

    await expect(isBrowserStorageEnabled()).resolves.toEqual(true);

    expect(mockPermissionsContains).not.toHaveBeenCalled();
  });

  it("should return true when optional storage permission has been granted", async () => {
    mockGetManifest.mockReturnValue({
      optional_permissions: ["storage"],
    });
    mockPermissionsContains.mockResolvedValue(true);

    await expect(isBrowserStorageEnabled()).resolves.toEqual(true);
  });

  it("should return false when optional storage permission has not been granted", async () => {
    mockGetManifest.mockReturnValue({
      optional_permissions: ["storage"],
    });
    mockPermissionsContains.mockResolvedValue(false);

    await expect(isBrowserStorageEnabled()).resolves.toEqual(false);
  });

  it("should return false when storage is not declared", async () => {
    mockGetManifest.mockReturnValue({
      permissions:          ["nativeMessaging"],
      optional_permissions: ["devtools"],
    });

    await expect(isBrowserStorageEnabled()).resolves.toEqual(false);

    expect(mockPermissionsContains).not.toHaveBeenCalled();
  });
});
