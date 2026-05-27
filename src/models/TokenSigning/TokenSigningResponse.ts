// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
