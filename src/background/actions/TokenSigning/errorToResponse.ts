/*
 * Copyright (c) 2020 The Web eID Project
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

import ErrorCode from "@web-eid/web-eid-library/errors/ErrorCode";
import { serializeError } from "@web-eid/web-eid-library/utils/errorSerializer";
import { TokenSigningErrorResponse } from "../../../models/TokenSigning/TokenSigningResponse";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";

export default function errorToResponse(nonce: string, error: any): TokenSigningErrorResponse {
  if (error.code === ErrorCode.ERR_WEBEID_USER_CANCELLED) {
    return tokenSigningResponse<TokenSigningErrorResponse>("user_cancel", nonce);
  } else if (error.code === ErrorCode.ERR_WEBEID_NATIVE_FATAL) {
    const nativeException = serializeError(error);

    return tokenSigningResponse<TokenSigningErrorResponse>("driver_error", nonce, { nativeException });
  } else {
    return tokenSigningResponse<TokenSigningErrorResponse>("technical_error", nonce, { error });
  }
}
