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
   * Disabled by default.
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
  ALLOW_HTTP_LOCALHOST: false,
});
