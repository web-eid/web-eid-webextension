/*
 * Copyright (c) 2020-2025 Estonian Information System Authority
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
