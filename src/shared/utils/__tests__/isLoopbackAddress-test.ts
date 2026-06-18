// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import isLoopbackAddress from "../isLoopbackAddress";

describe("isLoopbackAddress", () => {
  it.each([
    "localhost",
    "127.0.0.1",
    "127.255.255.255",
    "[::1]",
  ])("should detect %s as loopback", (host) => {
    expect(isLoopbackAddress(host)).toEqual(true);
  });

  it.each([
    "127.0.0.256",
    "128.0.0.1",
    "localhost.",
    "foo.localhost",
  ])("should not detect %s as loopback", (host) => {
    expect(isLoopbackAddress(host)).toEqual(false);
  });
});
