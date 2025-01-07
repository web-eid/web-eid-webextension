// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import UnknownError from "@web-eid.js/errors/UnknownError";

import {
  TokenSigningErrorResponse,
  TokenSigningStatusResponse,
} from "../../../models/TokenSigning/TokenSigningResponse";

import { MessageSender } from "../../../models/Browser/Runtime";
import NativeAppService from "../../services/NativeAppService";
import { config } from "../../../shared/configManager";
import errorToResponse from "./errorToResponse";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";

import Logger from "../../../shared/Logger";

const logger = new Logger("TokenSigning/status.ts");


export default async function status(
  sender: MessageSender,
  nonce: string,
): Promise<TokenSigningStatusResponse | TokenSigningErrorResponse> {
  logger.tabId = sender.tab?.id;

  const nativeAppService = new NativeAppService(sender.tab?.id);

  logger.log("Status requested");

  try {
    const nativeAppStatus = await nativeAppService.connect();

    // The token-signing uses x.y.z.build version string pattern
    const version = nativeAppStatus.version.replace("+", ".");

    if (!version) {
      throw new Error("missing native application version");
    }

    logger.info("Closing native app by sending the 'quit' command");

    await nativeAppService.send(
      { command: "quit", arguments: {} },
      config.NATIVE_GRACEFUL_DISCONNECT_TIMEOUT,
      new UnknownError("native application failed to close gracefully"),
    );

    logger.info("Returning success response");

    return tokenSigningResponse<TokenSigningStatusResponse>("ok", nonce, { version });
  } catch (error) {
    logger.info("Status check failed");
    logger.error(error);

    return errorToResponse(nonce, error);
  } finally {
    nativeAppService.close();
  }
}
