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

/**
 * Convert between byte array, Base64 and hexadecimal string formats.
 *
 * @example
 *  new ByteArray([ 72, 101, 108, 108, 111 ]).toBase64() // SGVsbG8=
 *  new ByteArray().fromHex("48656c6c6f").toBase64()     // SGVsbG8=
 *  new ByteArray().fromBase64("SGVsbG8=").toHex()       // 48656c6c6f
 *  new ByteArray().fromHex("48656c6c6f").valueOf()      // [72, 101, 108, 108, 111]
 */
export default class ByteArray {
  data: number[];

  constructor(byteArray?: number[]) {
    this.data = byteArray || [];
  }

  fromBase64(base64: string): ByteArray {
    this.data = atob(base64).split("").map(c => c.charCodeAt(0));

    return this;
  }

  toBase64(): string {
    return btoa(
      this.data.reduce((acc, curr) => acc += String.fromCharCode(curr), "")
    );
  }

  fromHex(hex: string): ByteArray {
    const data = [];

    for (let i = 0; i < hex.length; i += 2) {
      data.push(parseInt(hex.substr(i, 2), 16));
    }

    this.data = data;

    return this;
  }

  toHex(): string {
    return this.data.map((byte) => ("0" + (byte & 0xFF).toString(16)).slice(-2)).join("");
  }

  valueOf(): number[] {
    return this.data;
  }
}
