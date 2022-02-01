/*
 * Copyright (c) 2020-2021 Estonian Information System Authority
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

import Action from "@web-eid.js/models/Action";
import ErrorCode from "@web-eid.js/errors/ErrorCode";
import { ExtensionFailureResponse } from "@web-eid.js/models/message/ExtensionResponse";
import VersionMismatchError from "@web-eid.js/errors/VersionMismatchError";
import { serializeError } from "@web-eid.js/utils/errorSerializer";

import checkCompatibility from "./utils/checkCompatibility";
import config from "../config";

export default function actionErrorHandler(
  action:
  | Action.AUTHENTICATE_FAILURE
  | Action.GET_SIGNING_CERTIFICATE_FAILURE
  | Action.SIGN_FAILURE,

  originalError: any,
  libraryVersion: string,
  nativeAppVersion?: string,
): ExtensionFailureResponse {
  let error;

  /**
   * Always show the original error when native app version is unavailable.
   * The native app might not be available (ERR_WEBEID_NATIVE_UNAVAILABLE)
   * or an error ocurred in the extension before native app version could be detected.
   * In addition, if the native app version is missing, checkCompatibility(...) would throw an "Invalid SemVer string" error.
   *
   * Always show the original error when the error code is ERR_WEBEID_USER_CANCELLED.
   * In this case the user cancelled the operation in native app UI, which means the native app API had to be compatible for this action.
   */
  if (!nativeAppVersion || originalError?.code === ErrorCode.ERR_WEBEID_USER_CANCELLED) {
    error = originalError;

  } else {
    const versions = {
      extension: config.VERSION,
      library:   libraryVersion,
      nativeApp: nativeAppVersion,
    };

    const requiresUpdate = checkCompatibility(versions);

    error = (
      (requiresUpdate.extension || requiresUpdate.nativeApp)
        ? new VersionMismatchError(undefined, versions, requiresUpdate)
        : originalError
    );
  }

  return {
    action,
    error: serializeError(error),
  };
}
