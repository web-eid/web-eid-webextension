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
