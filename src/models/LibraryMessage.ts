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

import Action from "@web-eid/web-eid-library/models/Action";
import TypedMap from "./TypedMap";

export type LibraryMessage
  = StatusRequestMessage
  | AuthenticateRequestMessage
  | SignRequestMessage;

export interface StatusRequestMessage extends Object {
  action: Action.STATUS;
}

export interface AuthenticateRequestMessage extends Object {
  action: Action.AUTHENTICATE;
  getAuthChallengeUrl: string;
  postAuthTokenUrl: string;
  headers: TypedMap<string>;
  userInteractionTimeout: number;
  serverRequestTimeout: number;
}

export interface SignRequestMessage extends Object {
  action: Action.SIGN;
  postPrepareSigningUrl: string;
  postFinalizeSigningUrl: string;
  headers: TypedMap<string>;
  userInteractionTimeout: number;
  serverRequestTimeout: number;
}
