export class EventStreamSource {
  #onError?: (event: Event) => void;
  #handlers: Record<string, (event: Event) => void> = {};

  constructor(
    private eventTarget: EventTarget,
    private eventNames: string[],
    private options?: {
      onCancel?: (et: EventTarget) => void;
      onError?: (c: ReadableStreamDefaultController, e: Event) => void;
    },
  ) {}

  start(controller: ReadableStreamDefaultController) {
    for (const name of this.eventNames) {
      this.#handlers[name] = (event: Event) => {
        controller.enqueue(event);
      };
      this.eventTarget.addEventListener(name, this.#handlers[name]);
    }
    this.#onError = (err) => {
      if (this.options?.onError) {
        this.options.onError(controller, err);
      } else {
        controller.enqueue(err);
      }
    };
    this.eventTarget.addEventListener("error", this.#onError);
  }

  pull() {}

  cancel() {
    for (const name of Object.keys(this.#handlers)) {
      this.eventTarget.removeEventListener(name, this.#handlers[name]);
    }
    if (this.#onError) {
      this.eventTarget.removeEventListener("error", this.#onError);
    }
    if (this.options?.onCancel) {
      this.options?.onCancel(this.eventTarget);
    }
  }
}

// TODO adopt standard approach when ready:
// https://github.com/whatwg/streams/pull/980#issuecomment-1167194347
// https://web.dev/streams/#asynchronous-iteration
export function streamAsyncIterator(
  stream: ReadableStream,
  // deno-lint-ignore no-explicit-any
): AsyncGenerator<any, void, undefined> {
  return async function* () {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          return;
        }
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }();
}

export class EventIterator {
  #source: EventStreamSource;
  #stream: ReadableStream;
  // deno-lint-ignore no-explicit-any
  #iter?: AsyncGenerator<any, void, undefined>;

  constructor(
    private eventTarget: EventTarget,
    eventNames: string[],
    options?: {
      onCancel?: (et: EventTarget) => void;
      onError?: (c: ReadableStreamDefaultController, e: Event) => void;
    },
  ) {
    this.#source = new EventStreamSource(
      this.eventTarget,
      eventNames,
      options,
    );
    this.#stream = new ReadableStream(this.#source);
  }

  cancelSource() {
    this.#source.cancel();
  }

  [Symbol.asyncIterator]() {
    if (!this.#iter) {
      this.#iter = streamAsyncIterator(this.#stream);
    }
    return this.#iter;
  }
}
