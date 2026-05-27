// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

export default interface TokenSigningPromise {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}
