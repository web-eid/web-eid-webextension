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
