import { assertObjectMatch } from "https://deno.land/std@0.157.0/testing/asserts.ts";
import { EventIterator } from "/app/client/event-iterator.ts";

Deno.test("event iterator", async function () {
  const et = new EventTarget();
  const test = new EventIterator(et, [
    "open",
    "message",
  ]);

  const n = test[Symbol.asyncIterator]();
  const promises = [
    n.next().then((a) => assertObjectMatch(a.value, { data: "hi" })),
    n.next().then((a) => assertObjectMatch(a.value, { data: "there" })),
  ];
  et.dispatchEvent(new MessageEvent("open", { data: "hi" }));
  et.dispatchEvent(new MessageEvent("message", { data: "there" }));
  await Promise.all(promises);
});
