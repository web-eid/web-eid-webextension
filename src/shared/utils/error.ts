/*
 * Copyright (c) 2020-2026 Estonian Information System Authority
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

import ErrorCode from "@web-eid.js/errors/ErrorCode";
import UnknownError from "@web-eid.js/errors/UnknownError";

import { isRecord } from "./typeGuards";

export type ErrorWithMetadata = Error & {
  code?: ErrorCode | string;
  extension?: string;
};

export function getErrorCode(error: unknown): ErrorCode | string | undefined {
  if (!isRecord(error) || typeof error.code !== "string") {
    return undefined;
  }

  return error.code;
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  const fallback = new UnknownError(
    typeof error === "string" ? error : undefined
  );

  if (isRecord(error)) {
    Object.entries(error).forEach(([key, value]) => {
      Reflect.set(fallback, key, value);
    });
  }

  return fallback;
}

export function withExtensionVersion(error: unknown, extensionVersion: string): ErrorWithMetadata {
  const errorWithMetadata = toError(error) as ErrorWithMetadata;
  errorWithMetadata.extension = extensionVersion;

  return errorWithMetadata;
}
