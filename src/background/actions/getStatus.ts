/*
 * Copyright (c) 2020 The Web eID Project
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
import { serializeError } from "@web-eid/web-eid-library/utils/errorSerializer";

import config from "../../config";
import NativeAppService from "../services/NativeAppService";

export default async function getStatus(): Promise<any> {
  const extension = config.VERSION;

  try {
    const nativeAppService = new NativeAppService();
    const status           = await nativeAppService.connect();

    const nativeApp = (
      status.version.startsWith("v")
        ? status.version.substring(1)
        : status.version
    );

    nativeAppService.close();

    return {
      extension,
      nativeApp,

      action: Action.STATUS_SUCCESS,
    };
  } catch (error) {
    error.extension = extension;

    console.error("Status:", error);

    return {
      action: Action.STATUS_FAILURE,
      error:  serializeError(error),
    };
  }
}
