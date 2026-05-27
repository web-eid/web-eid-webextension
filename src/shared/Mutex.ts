// SPDX-FileCopyrightText: Estonian Information System Authority
// SPDX-License-Identifier: MIT

export default class Mutex {
  private lock: Promise<any> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: (value?: unknown) => void;

    const newLock = new Promise((resolve) => release = resolve);
    const oldLock = this.lock;

    this.lock = newLock;
    await oldLock;

    return () => release();
  }
}
