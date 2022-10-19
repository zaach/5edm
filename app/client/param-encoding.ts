import base64 from "https://deno.land/x/b64@1.1.24/src/base64.js";

export function encodeUrlParam(
  payload: ArrayBuffer,
): string {
  return base64.fromArrayBuffer(new Uint8Array(payload), true);
}

export function decodeUrlParam(
  param: string,
): ArrayBuffer {
  return base64.toArrayBuffer(param, true);
}
