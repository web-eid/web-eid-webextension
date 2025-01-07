// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

export default Object.freeze({
  NATIVE_APP_NAME: "eu.webeid",
  VERSION:         "{{package.version}}",

  NATIVE_MESSAGE_MAX_BYTES: 8192,

  /**
   * Time given in milliseconds to native application for closing gracefully after a command reply.
   * On timeout, the native application communication port is forcefully disconnected.
   */
  NATIVE_GRACEFUL_DISCONNECT_TIMEOUT: 2000, // 2 seconds

  /**
   * Web eID is able to provide Chrome Token Signing backwards compatibility.
   * When enabled, in addition to the Web eID library, the Web eID browser extension will process hwcrypto.js events.
   *
   * In this mode, Web-eID will need to inject the Token Signing page script to websites.
   *
   * This is a temporary solution. Web eID library should be used instead of hwcrypto.js.
   *
   * Enabled by default.
   *
   * @see https://github.com/open-eid/chrome-token-signing
   * @see https://github.com/hwcrypto/hwcrypto.js/wiki
   */
  TOKEN_SIGNING_BACKWARDS_COMPATIBILITY:  process.env.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY?.toUpperCase() === "TRUE",
  TOKEN_SIGNING_USER_INTERACTION_TIMEOUT: 1000 * 60 * 5, // 5 minutes

  /**
   * Should the Web eID extension allow http://localhost.
   *
   * The extension checks if the browser context is secure and the native application checks for the HTTPS protocol.
   * Localhost is considered to be secure context, even when HTTPS is not used.
   *
   * When this option is enabled, the extension reports localhost URLs to the native application with HTTPS.
   */
  ALLOW_HTTP_LOCALHOST: false as boolean,
});
