// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

const ipv4LoopbackAddressPattern = /^127\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)$/;

/**
 * Checks whether a normalized URL hostname is a loopback host.
 *
 * @param host Normalized `URL.hostname`; IPv6 literals include brackets, e.g. `[::1]`.
 * @returns `true` if host is loopback address
 */
export default function isLoopbackAddress(host: string): boolean {
  return (
    host === "localhost"                  ||
    ipv4LoopbackAddressPattern.test(host) ||
    host === "[::1]"
  );
}
