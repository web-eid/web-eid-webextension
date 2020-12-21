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

type TokenSigningError
  = "no_certificates"
  | "invalid_argument"
  | "user_cancel"
  | "not_allowed"
  | "driver_error"
  | "pin_blocked"
  | "technical_error";

export type TokenSigningResult
  = "ok"
  | TokenSigningError;

export interface TokenSigningResponse {
  src: string;
  nonce: string;
  extension: string;
  isWebeid: true;

  result: TokenSigningResult;
}

export interface TokenSigningStatusResponse extends TokenSigningResponse {
  result: "ok";
  version: string;
}

export interface TokenSigningCertResponse extends TokenSigningResponse {
  result: "ok";
  cert: string;
}

export interface TokenSigningSignResponse extends TokenSigningResponse {
  result: "ok";
  signature: string;
}

export interface TokenSigningErrorResponse extends TokenSigningResponse {
  result: TokenSigningError;

  // Exception details object, provided by Web-eID extension
  nativeException?: any;
}
