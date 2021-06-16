export interface NativeAppCommandGetCertificate {
  command: "get-signing-certificate";
  arguments: {
    "origin": string;
    "lang"?: string;
  };
}

export interface NativeAppCommandAuthenticate {
  command: "authenticate";
  arguments: {
    "nonce": string;
    "origin": string;
    "origin-cert": string | null;
    "lang"?: string;
  };
}

export interface NativeAppCommandSign {
  command: "sign";
  arguments: {
    "doc-hash": string;
    "hash-algo": string;
    "user-eid-cert": string;
    "origin": string;
    "lang"?: string;
  };
}

export interface NativeAppCommandQuit {
  command: "quit";
  arguments: {};
}


export type NativeAppMessage
  = NativeAppCommandGetCertificate
  | NativeAppCommandAuthenticate
  | NativeAppCommandSign
  | NativeAppCommandQuit;
