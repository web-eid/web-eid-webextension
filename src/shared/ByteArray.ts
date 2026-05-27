// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

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
  data: Array<number>;

  get length(): number {
    return this.data.length;
  }

  constructor(byteArray?: Array<number>) {
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

  valueOf(): Array<number> {
    return this.data;
  }
}
