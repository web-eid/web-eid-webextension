import { isRecord } from "./utils/typeGuards";

type HwcryptoFunction = (this: Hwcrypto, ...args: Array<unknown>) => Promise<unknown>;
type PatchableHwcryptoFunctionName = "debug" | "sign" | "getCertificate";
const PATCHABLE_HWCRYPTO_FUNCTIONS: Array<PatchableHwcryptoFunctionName> = ["debug", "sign", "getCertificate"];

interface Hwcrypto {
  use: (backend?: "chrome") => Promise<unknown>;
  sign: HwcryptoFunction;
  debug: HwcryptoFunction;
  getCertificate: HwcryptoFunction;
}

let isPatched = false;
let isRetried = false;

const patchHwcryptoFunction = (hwc: Hwcrypto) => (fnName: PatchableHwcryptoFunctionName): void => {
  const originalFn = hwc[fnName];

  hwc[fnName] = async function(this: Hwcrypto, ...args: Array<unknown>): Promise<unknown> {
    try {
      return await originalFn.apply(this, args);
    } catch (error) {
      const isNoImpl = error instanceof Error && error.message === "no_implementation";

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

function isHwcrypto(value: unknown): value is Hwcrypto {
  return (
    isRecord(value) &&
    typeof value.use === "function" &&
    typeof value.sign === "function" &&
    typeof value.debug === "function" &&
    typeof value.getCertificate === "function"
  );
}

export default function patchHwcrypto(): void {
  const hwc = (globalThis as { hwcrypto?: unknown }).hwcrypto;

  if (!isHwcrypto(hwc) || isPatched) return;

  PATCHABLE_HWCRYPTO_FUNCTIONS.forEach(patchHwcryptoFunction(hwc));

  isPatched = true;
}
