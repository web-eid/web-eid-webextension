// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

/**
 *
 * @param host hostname or ip address
 *
 * @returns true if is loopback address
 */

const ipv4LoopbackAddressPattern = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

/**
 * Checks whether host resolves to loopback address
 *
 * @param host One of IP-literal / IPv4address / reg-name aka hostname
 * @returns `true` if host is loopback address
 */
export default function isLoopbackAddress(host: string): boolean {
  return (
    host === "localhost"                  ||
    ipv4LoopbackAddressPattern.test(host) ||
    host === "[::1]"                      ||
    host === "[0000:0000:0000:0000:0000:0000:0000:0001]"
  );
}
