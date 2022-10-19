import { assertEquals } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import {
  InitiatorCryptoContext,
  JoinerCryptoContext,
} from "/app/client/crypto.ts";

const te = new TextEncoder();
const td = new TextDecoder();

Deno.test("encrypt/decrypt", async function () {
  // setup
  const initiator = new InitiatorCryptoContext();
  const { serializedPublicKey: ipk } = await initiator.init();

  const joiner = new JoinerCryptoContext();
  const joinAppData = te.encode("json or something from joiner");
  const joinResult = await joiner.initSender(ipk, joinAppData);

  const result = await initiator.handleJoin(
    joinResult.envelope,
  );
  console.log("plaintext from joiner", td.decode(result.plaintext));
  assertEquals(result.plaintext, joinAppData.buffer);

  const responseData = te.encode("json or something from initiator");
  const responseResult = await initiator.seal(responseData);
  const result2 = await joiner.open(
    responseResult.payload,
    responseResult.header,
  );
  assertEquals(result2, responseData.buffer);
  console.log("plaintext from initiator", td.decode(result2));

  {
    const raw = "try";
    const msg = await initiator.seal(te.encode(raw));
    const result = await joiner.open(msg.payload, msg.header);
    assertEquals(td.decode(result), raw);
    console.log("decrypted: ", td.decode(result));
  }

  {
    const raw = "again";
    const msg = await initiator.seal(te.encode(raw));
    const result = await joiner.open(msg.payload, msg.header);
    assertEquals(td.decode(result), raw);
    console.log("decrypted: ", td.decode(result));
  }
});
