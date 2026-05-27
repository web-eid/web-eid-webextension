// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

export type TokenSigningMessage
  = TokenSigningGetCertificateMessage
  | TokenSigningSignMessage
  | TokenSigningVersionMessage;

export interface TokenSigningMessageBase {
  src: "page.js";
  nonce: string;
}

export interface TokenSigningGetCertificateMessage extends TokenSigningMessageBase {
  type: "CERT";
  lang?: string;
  filter?: "AUTH" | "SIGN";
}

export interface TokenSigningSignMessage extends TokenSigningMessageBase {
  type: "SIGN";
  cert: string;
  hash: string;
  hashtype: string;
  lang?: string;
  info?: string;
}

export interface TokenSigningVersionMessage extends TokenSigningMessageBase {
  type: "VERSION";
}
