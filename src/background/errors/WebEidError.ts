/*
 * Copyright (c) 2020-2026 Estonian Information System Authority
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

import ActionPendingError from "@web-eid.js/errors/ActionPendingError";
import ActionTimeoutError from "@web-eid.js/errors/ActionTimeoutError";
import ContextInsecureError from "@web-eid.js/errors/ContextInsecureError";
import ExtensionUnavailableError from "@web-eid.js/errors/ExtensionUnavailableError";
import MissingParameterError from "@web-eid.js/errors/MissingParameterError";
import NativeFatalError from "@web-eid.js/errors/NativeFatalError";
import NativeInvalidArgumentError from "@web-eid.js/errors/NativeInvalidArgumentError";
import NativeUnavailableError from "@web-eid.js/errors/NativeUnavailableError";
import UnknownError from "@web-eid.js/errors/UnknownError";
import UserCancelledError from "@web-eid.js/errors/UserCancelledError";
import UserTimeoutError from "@web-eid.js/errors/UserTimeoutError";
import VersionInvalidError from "@web-eid.js/errors/VersionInvalidError";
import VersionMismatchError from "@web-eid.js/errors/VersionMismatchError";

type WebEidError =
  | ActionPendingError
  | ActionTimeoutError
  | ContextInsecureError
  | ExtensionUnavailableError
  | MissingParameterError
  | NativeFatalError
  | NativeInvalidArgumentError
  | NativeUnavailableError
  | UnknownError
  | UserCancelledError
  | UserTimeoutError
  | VersionInvalidError
  | VersionMismatchError
  | Error;

export default WebEidError;
