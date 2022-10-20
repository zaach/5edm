import { assertEquals } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { Base64EnvelopeEncoding } from "./encoding.ts";

const te = new TextEncoder();

// deno-lint-ignore no-explicit-any
const tuple = <T extends [any] | any[]>(args: T): T => args;

const encoder = new Base64EnvelopeEncoding();

Deno.test("encode/decode", function () {
  const header = te.encode("head data");
  const payload = te.encode("payload data");

  const envelope = { header, payload };
  const encoded = encoder.encodeEnvelope(envelope);
  console.log(encoded);
  const decoded = encoder.decodeEnvelope(encoded);
  const reconstructed = {
    header: new Uint8Array(decoded.header),
    payload: new Uint8Array(decoded.payload),
  };

  assertEquals(reconstructed, envelope);
});

Deno.test("encode/decode handshake", function () {
  const header = tuple([
    te.encode("header data"),
    te.encode("header data 2"),
  ]);
  const payload = tuple([
    te.encode("payload data"),
    te.encode("payload data 2"),
  ]);

  const envelope = { header, payload };
  const encoded = encoder.encodeHandshakeEnvelope(envelope);
  console.log(encoded);
  const decoded = encoder.decodeHandshakeEnvelope(encoded);
  const reconstructed = {
    header: tuple([
      new Uint8Array(decoded.header[0]),
      new Uint8Array(decoded.header[1]),
    ]),
    payload: tuple([
      new Uint8Array(decoded.payload[0]),
      new Uint8Array(decoded.payload[1]),
    ]),
  };

  assertEquals(reconstructed, envelope);
});
