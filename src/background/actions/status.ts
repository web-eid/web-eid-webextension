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

import { MessageSender } from "../../models/Browser/Runtime";
import NativeAppService from "../services/NativeAppService";
import checkCompatibility from "../../shared/utils/checkCompatibility";
import { config } from "../../shared/configManager";

import Logger from "../../shared/Logger";

const logger = new Logger("status.ts");

export default async function status(sender: MessageSender, libraryVersion: string): Promise<ExtensionStatusResponse | ExtensionFailureResponse> {
  logger.tabId = sender.tab?.id;

  logger.log("Status requested");

  const extensionVersion = config.VERSION;
  const nativeAppService = new NativeAppService(sender.tab?.id);

  try {
    const status = await nativeAppService.connect();

    const nativeApp = (
      status.version.startsWith("v")
        ? status.version.substring(1)
        : status.version
    );

    logger.info("Closing native app by sending the 'quit' command");

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

    logger.info("Checking requiresUpdate", requiresUpdate);

    if (requiresUpdate.extension || requiresUpdate.nativeApp) {
      throw new VersionMismatchError(undefined, componentVersions, requiresUpdate);
    }

    logger.info("Returning success response");

    return {
      action: Action.STATUS_SUCCESS,

      ...componentVersions,
    };
  } catch (error: any) {
    logger.info("Status check failed");
    logger.error(error);

    error.extension = extensionVersion;

    return {
      action: Action.STATUS_FAILURE,
      error:  serializeError(error),
    };
  } finally {
    nativeAppService.close();
  }
}
