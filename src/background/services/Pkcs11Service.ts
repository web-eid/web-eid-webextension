/*
 * Copyright (c) 2020-2022 Estonian Information System Authority
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

import config from "../../config";

export default class Pkcs11Service {
  static async unload(moduleName: string) {
    if (!browser.pkcs11) return;

    config.DEBUG && console.log(`Pkcs11Service.unload '${moduleName}'`);

    try {
      if (await browser.pkcs11.isModuleInstalled(moduleName)) {
        await browser.pkcs11.uninstallModule(moduleName);
        console.log(`Unloaded PKCS #11 module '${moduleName}'`);
      } else {
        config.DEBUG && console.log(`PKCS #11 module not installed '${moduleName}'`);
      }
    } catch (error) {
      console.error(error);
      console.error(`Failed to unload PKCS #11 module '${moduleName}'`);
    }
  }
}
