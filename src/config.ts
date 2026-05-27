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

  // Default: false
  TOKEN_SIGNING_BACKWARDS_COMPATIBILITY:  process.env.TOKEN_SIGNING_BACKWARDS_COMPATIBILITY?.toUpperCase() === "TRUE",
  TOKEN_SIGNING_USER_INTERACTION_TIMEOUT: 1000 * 60 * 5, // 5 minutes

  // Default: false
  DEBUG: process.env.DEBUG?.toUpperCase() === "TRUE",
});
