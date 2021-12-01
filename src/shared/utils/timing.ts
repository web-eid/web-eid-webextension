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

/**
 * Sleeps for a specified time before resolving the returned promise.
 *
 * @param milliseconds Time in milliseconds until the promise is resolved
 *
 * @returns Empty promise
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds);
  });
}

/**
 * Throws an error after a specified time has passed.
 *
 * Useful in combination with Promise.race(...)
 *
 * @param milliseconds Time in milliseconds until the promise is rejected
 * @param error Error object which will be used to reject the promise
 *
 * @example
 *   await Promise.race([
 *     doAsyncOperation(),
 *     throwAfterTimeout(3600, new TimeoutError()),
 *   ])
 */
export async function throwAfterTimeout(milliseconds: number, error: Error): Promise<void> {
  await sleep(milliseconds);
  throw error;
}
