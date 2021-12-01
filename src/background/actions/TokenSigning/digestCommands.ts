/**
 * Map of OpenSSL digest commands to digest algorithm names.
 *
 * OpenSSL digest commands are deprecated. This is only provided for backwards compatibility.
 *
 * @see https://www.openssl.org/docs/manmaster/man1/openssl-list.html
 */
export default {
  "sha224":   "SHA-224",
  "sha256":   "SHA-256",
  "sha384":   "SHA-384",
  "sha512":   "SHA-512",
  "sha3-224": "SHA3-224",
  "sha3-256": "SHA3-256",
  "sha3-384": "SHA3-384",
  "sha3-512": "SHA3-512",
} as Record<string, string>;
