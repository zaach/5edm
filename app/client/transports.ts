import { EventIterator } from "./event-iterator.ts";

export interface ReceiverTransport {
  listen(url: string): AsyncGenerator<MessageEvent, void, void>;
  close(): Promise<void>;
}

export type SendResponse = Pick<Response, "ok" | "status" | "statusText">;
export interface SenderTransport {
  send: (
    body: string,
    channelId: string,
  ) => Promise<SendResponse>;
}

export class SseTransport implements ReceiverTransport {
  #sources: EventIterator[] = [];
  constructor(
    private baseUrl = "/api/sse?channelId=",
    private EventSourceClass: { new (url: string): EventSource } = EventSource,
  ) {}
  listen(channelId: string): AsyncGenerator<MessageEvent, void, void> {
    const es = new this.EventSourceClass(`${this.baseUrl}${channelId}`);
    const source = new EventIterator(
      es,
      ["open", "message"],
      {
        onCancel: () => es.close(),
      },
    );
    this.#sources.push(source);
    return source[Symbol.asyncIterator]();
  }

  close(): Promise<void> {
    for (const s of this.#sources) {
      s.cancelSource();
    }
    this.#sources = [];
    return Promise.resolve();
  }
}

export class FetchSenderTransport implements SenderTransport {
  constructor(private baseUrl = "/api/send?channelId=") {}
  // TODO queue sends
  send(body: string, channelId: string) {
    return this.#send(body, channelId);
  }

  async #send(body: string, channelId: string) {
    let attempts = 0;
    do {
      let result;
      try {
        result = await fetch(`${this.baseUrl}${channelId}`, {
          method: "POST",
          body,
        });
        return {
          ok: result.ok,
          status: result.status,
          statusText: result.statusText,
        };
      } catch (e) {
        console.warn(attempts, e);
      }
      if (!result?.ok) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts++));
      }
    } while (attempts < 5);
    throw new Error("could not send");
  }
}
