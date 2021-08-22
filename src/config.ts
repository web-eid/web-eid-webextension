/*
 * Copyright (c) 2020-2021 Estonian Information System Authority
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

  TOKEN_SIGNING_BACKWARDS_COMPATIBILITY:  true,
  TOKEN_SIGNING_USER_INTERACTION_TIMEOUT: 1000 * 60 * 5, // 5 minutes
});
