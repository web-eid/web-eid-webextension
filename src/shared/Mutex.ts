export default class Mutex {
  private lock: Promise<any> = Promise.resolve();

  async acquire(): Promise<Function> {
    let release: Function;

    const newLock = new Promise((resolve) => release = resolve);
    const oldLock = this.lock;

    this.lock = newLock;
    await oldLock;

    return (): Function => release();
  }
}
