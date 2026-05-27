// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import ErrorCode from "@web-eid.js/errors/ErrorCode";
import { serializeError } from "@web-eid.js/utils/errorSerializer";

import { TokenSigningErrorResponse } from "../../../models/TokenSigning/TokenSigningResponse";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";

export default function errorToResponse(nonce: string, error: any): TokenSigningErrorResponse {
  if (error.code === ErrorCode.ERR_WEBEID_USER_CANCELLED) {
    return tokenSigningResponse<TokenSigningErrorResponse>("user_cancel", nonce);
  } else if (error.code === ErrorCode.ERR_WEBEID_NATIVE_FATAL ||
             error.code === ErrorCode.ERR_WEBEID_NATIVE_INVALID_ARGUMENT) {
    const nativeException = serializeError(error);

    return tokenSigningResponse<TokenSigningErrorResponse>("driver_error", nonce, { nativeException });
  } else {
    return tokenSigningResponse<TokenSigningErrorResponse>("technical_error", nonce, { error });
  }
}
