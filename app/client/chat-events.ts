export enum ChatEventType {
  channel_open = "channel_open",
  channel_error = "channel_error",
  invite = "invite",
  initiated = "initiated",
  message = "message",
  queued = "queued",
  sent = "sent",
  failed = "failed",
  idle = "idle",
  active = "active",
  disconnected = "disconnected",
  dead_session = "dead_session",
}

export interface BaseChatEvent {
  [ChatEventType.channel_open]: { readyState: number };
  [ChatEventType.channel_error]: { readyState: number };
  [ChatEventType.invite]: { invite: string };
  [ChatEventType.initiated]: Record<never, never>;
  [ChatEventType.message]: MessageValue;
  [ChatEventType.queued]: MessageValue;
  [ChatEventType.sent]: MessageValue;
  [ChatEventType.failed]: MessageValue;
  [ChatEventType.idle]: Record<never, never>;
  [ChatEventType.active]: Record<never, never>;
  [ChatEventType.disconnected]: { local: boolean };
  [ChatEventType.dead_session]: { openErrors: number };
}

export class ChatEvent<
  T extends ChatEventType,
  D extends BaseChatEvent[T] = BaseChatEvent[T],
> extends CustomEvent<D> {
  constructor(name: T, detail: CustomEventInit<D>) {
    super(name, detail);
  }

  static addTypedListener<T extends ChatEventType>(
    eventTarget: EventTarget,
    type: T,
    fn: (e: ChatEvent<T>) => void,
  ) {
    eventTarget.addEventListener(type, (e) => {
      if (eventTypeGuard(e, type, ChatEvent<T>)) {
        fn(e);
      }
    });
  }
}

// deno-lint-ignore no-explicit-any
type Constructor<T> = { new (...args: any[]): T };
function eventTypeGuard<T extends ChatEventType>(
  o: Event,
  type: T,
  className: Constructor<ChatEvent<T>>,
): o is ChatEvent<T> {
  return o instanceof className && o.type === type;
}

export enum MessageType {
  message = 0,
  ack = 1,
  disconnect = 2,
  meta = 3,
}

export interface BaseMessages {
  [MessageType.meta]: { name: string };
  [MessageType.message]: { msg: string };
  [MessageType.ack]: Record<never, never>;
  [MessageType.disconnect]: Record<never, never>;
}

export type Message<T extends keyof BaseMessages> = BaseMessages[T] & {
  id: number;
  lastSeenId: number;
  type: T;
};

type Messages = {
  [K in keyof BaseMessages]: Message<K>;
};
type Values<T> = T[keyof T];

export type MessageValue = Values<Messages>;
