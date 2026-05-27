// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

import UnknownError from "@web-eid.js/errors/UnknownError";

import {
  TokenSigningErrorResponse,
  TokenSigningStatusResponse,
} from "../../../models/TokenSigning/TokenSigningResponse";

import NativeAppService from "../../services/NativeAppService";
import config from "../../../config";
import errorToResponse from "./errorToResponse";
import tokenSigningResponse from "../../../shared/tokenSigningResponse";


export default async function status(
  nonce: string,
): Promise<TokenSigningStatusResponse | TokenSigningErrorResponse> {
  const nativeAppService = new NativeAppService();

  try {
    const nativeAppStatus = await nativeAppService.connect();

    // The token-signing uses x.y.z.build version string pattern
    const version = nativeAppStatus.version.replace("+", ".");

    if (!version) {
      throw new Error("missing native application version");
    }

    await nativeAppService.send(
      { command: "quit", arguments: {} },
      config.NATIVE_GRACEFUL_DISCONNECT_TIMEOUT,
      new UnknownError("native application failed to close gracefully"),
    );

    return tokenSigningResponse<TokenSigningStatusResponse>("ok", nonce, { version });
  } catch (error) {
    console.error(error);
    return errorToResponse(nonce, error);
  } finally {
    nativeAppService.close();
  }
}
