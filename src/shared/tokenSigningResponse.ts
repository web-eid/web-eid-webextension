// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import {
  TokenSigningResponse,
  TokenSigningResult,
} from "../models/TokenSigning/TokenSigningResponse";

import { config } from "../shared/configManager";

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
