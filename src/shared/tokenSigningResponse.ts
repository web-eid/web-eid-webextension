/*
 * Copyright (c) 2020-2023 Estonian Information System Authority
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

import {
  TokenSigningResponse,
  TokenSigningResult,
} from "../models/TokenSigning/TokenSigningResponse";

import config from "../config";

/**
 * Helper function to compose a token signing response message
 *
 * @param result Token signing result from the native application
 * @param nonce  The nonce related to the action
 * @param optional Optional message fields to be included in the response
 *
 * @returns A token signing response object
 */
export default function tokenSigningResponse<T extends TokenSigningResponse>(
  result: TokenSigningResult,
  nonce: string,
  optional?: Record<string, any>
): T {
  const response = {
    nonce,
    result,

    src:       "background.js",
    extension: config.VERSION,
    isWebeid:  true,

    ...(optional ? optional : {}),
  };

  return response as T;
}
