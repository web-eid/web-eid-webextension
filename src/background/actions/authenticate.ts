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

import Action from "@web-eid/web-eid-library/models/Action";
import ProtocolInsecureError from "@web-eid/web-eid-library/errors/ProtocolInsecureError";
import UserTimeoutError from "@web-eid/web-eid-library/errors/UserTimeoutError";
import ServerTimeoutError from "@web-eid/web-eid-library/errors/ServerTimeoutError";
import OriginMismatchError from "@web-eid/web-eid-library/errors/OriginMismatchError";
import { serializeError } from "@web-eid/web-eid-library/utils/errorSerializer";

import NativeAppService from "../services/NativeAppService";
import WebServerService from "../services/WebServerService";
import TypedMap from "../../models/TypedMap";
import HttpResponse from "../../models/HttpResponse";
import { pick, throwAfterTimeout, isSameOrigin } from "../../shared/utils";
import ByteArray from "../../shared/ByteArray";
import { MessageSender } from "../../models/Browser/Runtime";

export default async function authenticate(
  getAuthChallengeUrl: string,
  postAuthTokenUrl: string,
  headers: TypedMap<string>,
  userInteractionTimeout: number,
  serverRequestTimeout: number,
  sender: MessageSender,
  lang?: string,
): Promise<object | void> {
  let webServerService: WebServerService | undefined;
  let nativeAppService: NativeAppService | undefined;

  try {
    if (!getAuthChallengeUrl.startsWith("https:")) {
      throw new ProtocolInsecureError(`HTTPS required for getAuthChallengeUrl ${getAuthChallengeUrl}`);
    }

    if (!postAuthTokenUrl.startsWith("https:")) {
      throw new ProtocolInsecureError(`HTTPS required for postAuthTokenUrl ${postAuthTokenUrl}`);
    }

    if (!isSameOrigin(getAuthChallengeUrl, postAuthTokenUrl)) {
      throw new OriginMismatchError();
    }

    if (!sender.tab?.id || sender.tab?.id === browser.tabs.TAB_ID_NONE) {
      throw new Error("invalid sender tab");
    }

    webServerService = new WebServerService(sender.tab.id);
    nativeAppService = new NativeAppService();

    const nativeAppStatus = await nativeAppService.connect();

    console.log("Authenticate: connected to native", nativeAppStatus);

    const response = await Promise.race([
      webServerService.fetch(getAuthChallengeUrl, {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }),

      throwAfterTimeout(
        serverRequestTimeout,
        new ServerTimeoutError(`server failed to respond in time - GET ${getAuthChallengeUrl}`),
      ),
    ]) as HttpResponse<{ nonce: string }>;

    console.log("Authenticate: getAuthChallengeUrl fetched");

    const token = await Promise.race([
      nativeAppService.send({
        command: "authenticate",

        arguments: {
          "nonce":  response.body.nonce,
          "origin": (new URL(response.url)).origin,

          "origin-cert": (
            response.certificateInfo?.rawDER
              ? new ByteArray(response.certificateInfo?.rawDER).toBase64()
              : null
          ),

          ...(lang ? { lang } : {}),
        },
      }),

      throwAfterTimeout(userInteractionTimeout, new UserTimeoutError()),
    ]);

    console.log("Authenticate: authentication token received");

    const tokenResponse = await Promise.race([
      webServerService.fetch<any>(postAuthTokenUrl, {
        method: "POST",

        headers: {
          ...headers,
          "Content-Type": "application/json",
        },

        body: JSON.stringify(token),
      }),

      throwAfterTimeout(
        serverRequestTimeout,
        new ServerTimeoutError(`server failed to respond in time - POST ${postAuthTokenUrl}`),
      ),
    ]);

    console.log("Authenticate: token accepted by the server");

    return {
      action: Action.AUTHENTICATE_SUCCESS,

      response: {
        ...pick(tokenResponse, [
          "body",
          "headers",
          "ok",
          "redirected",
          "status",
          "statusText",
          "type",
          "url",
        ]),
      },
    };
  } catch (error) {
    console.error("Authenticate:", error);

    return {
      action: Action.AUTHENTICATE_FAILURE,
      error:  serializeError(error),
    };
  } finally {
    nativeAppService?.close();
  }
}
