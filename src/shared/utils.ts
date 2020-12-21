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

import TypedMap from "../models/TypedMap";

/**
 * Transforms the Fetch API Header object to plain JSON.stringify-able object type.
 *
 * @param headers Fetch API Headers object
 *
 * @returns The headers in a simple object, where keys and values are strings.
 *
 * @example
 *   headersToObject(fetchResponse.headers)
 *   // => {
 *   //   "connection":     "keep-alive",
 *   //   "content-length": "49",
 *   //   "content-type":   "application/json; charset=utf-8",
 *   //   "date":           "Mon, 27 Apr 2020 06:28:54 GMT",
 *   //   "etag":           "W/\"30-YHV2nUGU912eoDvI+roJ2Yqn5SA\"",
 *   //   "x-powered-by":   "Express"
 *   // }
 */
export function headersToObject(headers: Headers): TypedMap<string> {
  function reducer(acc: TypedMap<string>, curr: Array<string>): TypedMap<string> {
    if (typeof curr[0] == "string") {
      acc[curr[0]] = curr[1];
    }
    return acc;
  }

  const headersArray = [...headers.entries()];
  const headersMap   = headersArray.reduce(reducer, {});

  return headersMap;
}

/**
 * Creates an object composed of the picked object properties.
 *
 * @param object Object to pick from
 * @param keys   Keys to pick from the object
 *
 * @returns The new object
 *
 * @example
 *   const object = { "a": 1, "b": 2, "c": 3 };
 *   pick(object, ["a", "b"]);
 *   // => { "a": 1, "b": 2 }
 */
export function pick(object: any, keys: string[]): object {
  return Object.keys(object)
    .filter((objectKey: string) => keys.includes(objectKey))
    .reduce((acc: TypedMap<string>, curr) => (acc[curr] = object[curr], acc), {});
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });
}

export async function throwAfterTimeout(milliseconds: number, error: Error): Promise<void> {
  await sleep(milliseconds);
  throw error;
}

export function objectByteSize(object: any): number {
  const objectString     = JSON.stringify(object);
  const objectStringBlob = new Blob([objectString]);

  return objectStringBlob.size;
}

export function isSameOrigin(url1: string, url2: string): boolean {
  const origin1 = new URL(url1).origin;
  const origin2 = new URL(url2).origin;

  return origin1 === origin2;
}
