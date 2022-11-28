import {
  didFromKeyBytes,
  EDWARDS_DID_PREFIX,
  keyBytesFromDid,
} from "./did/mod.ts";

export interface Identity {
  encode(payload: Uint8Array): string;
  decode(param: string): Uint8Array;
}

export class DecentralizedIdentity implements Identity {
  constructor(private prefix = EDWARDS_DID_PREFIX) {}

  encode(payload: Uint8Array): string {
    return didFromKeyBytes(payload, this.prefix);
  }

  decode(param: string): Uint8Array {
    return keyBytesFromDid(param, this.prefix);
  }
}
