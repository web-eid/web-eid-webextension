/*
 * Copyright (c) 2022-2025 Estonian Information System Authority
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

interface Hwcrypto {
  [key: string]: any;

  use: (backend?: "chrome") => Promise<any>;
  sign: (cert: string, hash: string, options: any) => Promise<any>;
  debug: () => Promise<any>;
  getCertificate: (options: any) => Promise<any>;
}

let isPatched = false;
let isRetried = false;

const patchHwcryptoFunction = (hwc: Hwcrypto) => (fnName: string) => {
  const originalFn = hwc[fnName];

  hwc[fnName] = async function(...args: Array<any>): Promise<any> {
    try {
      return await originalFn.apply(this, args);
    } catch (error) {
      const isNoImpl = (error as Error)?.message === "no_implementation";

      if (isNoImpl && !isRetried) {
        isRetried = true;

        // Force hwcrypto to re-detect the extension
        await hwc.use("chrome");

        // Try the Hwcrypto function again
        return await originalFn.apply(this, args);
      } else {
        // re-throw the original error
        throw error;
      }
    }
  };
};

export default function patchHwcrypto(): void {
  const hwc = (globalThis as any)?.hwcrypto;

  if (!hwc || isPatched) return;

  ["debug", "sign", "getCertificate"].forEach(patchHwcryptoFunction(hwc));

  isPatched = true;
}
