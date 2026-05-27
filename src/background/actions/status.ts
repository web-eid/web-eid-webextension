// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT


import {
  ExtensionFailureResponse,
  ExtensionStatusResponse,
} from "@web-eid.js/models/message/ExtensionResponse";

import Action from "@web-eid.js/models/Action";
import UnknownError from "@web-eid.js/errors/UnknownError";
import VersionMismatchError from "@web-eid.js/errors/VersionMismatchError";
import { serializeError } from "@web-eid.js/utils/errorSerializer";

import NativeAppService from "../services/NativeAppService";
import checkCompatibility from "../../shared/utils/checkCompatibility";
import config from "../../config";

export default async function status(libraryVersion: string): Promise<ExtensionStatusResponse | ExtensionFailureResponse> {
  const extensionVersion = config.VERSION;
  const nativeAppService = new NativeAppService();

  try {

    const status = await nativeAppService.connect();

    const nativeApp = (
      status.version.startsWith("v")
        ? status.version.substring(1)
        : status.version
    );

    await nativeAppService.send(
      { command: "quit", arguments: {} },
      config.NATIVE_GRACEFUL_DISCONNECT_TIMEOUT,
      new UnknownError("native application failed to close gracefully"),
    );

    const componentVersions = {
      library:   libraryVersion,
      extension: extensionVersion,

      nativeApp,
    };

    const requiresUpdate = checkCompatibility(componentVersions);

    if (requiresUpdate.extension || requiresUpdate.nativeApp) {
      throw new VersionMismatchError(undefined, componentVersions, requiresUpdate);
    }

    return {
      action: Action.STATUS_SUCCESS,

      ...componentVersions,
    };
  } catch (error: any) {
    error.extension = extensionVersion;

    console.error("Status:", error);

    return {
      action: Action.STATUS_FAILURE,
      error:  serializeError(error),
    };
  } finally {
    nativeAppService.close();
  }
}
