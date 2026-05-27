// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
