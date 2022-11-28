import { InitiatorCryptoContext, JoinerCryptoContext } from "./crypto.ts";
import {
  Base64EnvelopeEncoding,
  EnvelopeEncoding,
  InternalFormat,
  InternalFormatJson,
} from "./encoding.ts";
import { encodeUrlParam } from "./param-encoding.ts";
import {
  FetchSenderTransport,
  HttpTransportCreator,
  ReceiverTransport,
  SenderTransport,
  SendResponse,
  SseTransport,
  TransportCreator,
} from "./transports.ts";

import { DecentralizedIdentity, Identity } from "./identity.ts";

export enum SessionEventType {
  channel_error = "channel_error",
  channel_open = "channel_open",
  open_error = "open_error",
  message = "message",
  handshake = "handshake",
}

type ObjectValue = Record<string, unknown>;

interface BaseSessionEvent<MessageValueType> {
  [SessionEventType.channel_open]: { readyState: number };
  [SessionEventType.channel_error]: { readyState: number };
  [SessionEventType.message]: MessageValueType;
  [SessionEventType.handshake]: MessageValueType;
  [SessionEventType.open_error]: Record<never, never>;
}

interface SessionEvent<
  MessageValueType,
  D extends keyof BaseSessionEvent<MessageValueType>,
> {
  type: D;
  detail: BaseSessionEvent<MessageValueType>[D];
}

type SessionEvents<MessageValueType> = {
  [K in keyof BaseSessionEvent<MessageValueType>]: SessionEvent<
    MessageValueType,
    K
  >;
};
export type SessionEventValues<MessageValueType> = SessionEvents<
  MessageValueType
>[keyof SessionEvents<MessageValueType>];

export interface Session<MessageValueType extends ObjectValue = ObjectValue> {
  sessionId?: string;
  toSessionId?: string;

  listen(): AsyncGenerator<SessionEventValues<MessageValueType>, void, void>;
  send: (
    body: MessageValueType,
  ) => Promise<SendResponse & { requestId: number }>;
  disconnect(): Promise<void>;
}

export interface SessionWithReplay<
  MessageValueType extends ObjectValue = ObjectValue,
> extends Session<MessageValueType> {
  clearCache(requestIds: number[]): void;
  resendFromCache(requestIds: number[]): Promise<void>;
}

export type ConnectedSession<
  MessageValueType extends ObjectValue = ObjectValue,
  SessionType extends Session<MessageValueType> = Session<MessageValueType>,
> =
  & Omit<SessionType, "sessionId" | "toSessionId">
  & Required<Pick<Session<MessageValueType>, "sessionId" | "toSessionId">>;

export class EncryptedSession<MessageValueType extends ObjectValue>
  implements Session<MessageValueType> {
  sessionId?: string;
  toSessionId?: string;

  constructor(
    protected cryptoContext: InitiatorCryptoContext | JoinerCryptoContext,
    protected receiver: ReceiverTransport = new SseTransport(),
    protected sender: SenderTransport = new FetchSenderTransport(),
    protected wireFormat: EnvelopeEncoding = new Base64EnvelopeEncoding(),
    protected format: InternalFormat = new InternalFormatJson(),
    protected enableCache = true,
  ) {}

  async disconnect() {
    await this.receiver.close();
  }

  async *waitForJoin(): AsyncGenerator<
    SessionEventValues<MessageValueType>,
    void,
    void
  > {
    if (
      !(this.cryptoContext instanceof InitiatorCryptoContext) ||
      !this.cryptoContext.handshakeChannelId
    ) {
      throw new Error("Must be the initiating party to accept joins");
    }
    const channelId = encodeUrlParam(this.cryptoContext.handshakeChannelId);
    for await (const event of this.receiver.listen(channelId)) {
      if (event.type === "open") {
        yield this.#openEvent(event);
      } else if (event.type === "error") {
        yield this.#errorEvent(event);
      } else {
        try {
          const decoded = this.wireFormat.decodeHandshakeEnvelope(event.data);
          const { plaintext, toSessionId, sessionId } = await this.cryptoContext
            .handleJoin(
              decoded,
            );
          const message = this.format.decode(plaintext) as MessageValueType;
          this.sessionId = encodeUrlParam(sessionId);
          this.toSessionId = encodeUrlParam(toSessionId);
          yield this.#event(SessionEventType.handshake, message);
          return;
        } catch (e) {
          console.warn(event, e);
        }
      }
    }
  }

  async join(pk: Uint8Array, initialMessage: MessageValueType) {
    if (!(this.cryptoContext instanceof JoinerCryptoContext)) {
      throw new Error("Must be the joining party to join");
    }

    const plaintext = this.format.encode(initialMessage);
    const { envelope, toChannelId, sessionId, toSessionId } = await this
      .cryptoContext
      .initSender(
        pk,
        plaintext,
      );
    const encoded = this.wireFormat.encodeHandshakeEnvelope(envelope);
    this.sessionId = encodeUrlParam(sessionId);
    this.toSessionId = encodeUrlParam(toSessionId);
    await this.sender.send(encoded, encodeUrlParam(toChannelId));
  }

  #event<T extends keyof BaseSessionEvent<MessageValueType>>(
    type: T,
    detail: BaseSessionEvent<MessageValueType>[T],
  ): SessionEvent<MessageValueType, T> {
    return {
      type,
      detail,
    };
  }

  #openEvent(event: MessageEvent) {
    return this.#event(SessionEventType.channel_open, {
      readyState: (event.target as EventSource)?.readyState,
    });
  }
  #errorEvent(event: MessageEvent) {
    return this.#event(SessionEventType.channel_error, {
      readyState: (event.target as EventSource)?.readyState,
    });
  }

  async *listen(): AsyncGenerator<
    SessionEventValues<MessageValueType>,
    void,
    void
  > {
    if (!this.sessionId) {
      throw this.notInitializedError();
    }
    for await (const event of this.receiver.listen(this.sessionId)) {
      if (event.type === "open") {
        yield this.#openEvent(event);
      } else if (event.type === "error") {
        yield this.#errorEvent(event);
      } else {
        try {
          const decoded = this.wireFormat.decodeEnvelope(event.data);
          const plaintext = await this.cryptoContext.open(
            decoded.payload,
            decoded.header,
          );
          const detail = this.format.decode(plaintext) as MessageValueType;
          yield this.#event(SessionEventType.message, detail);
        } catch (e) {
          console.warn(event, e);
          yield this.#event(SessionEventType.open_error, {});
        }
      }
    }
  }

  #requestIds = 0;
  protected async senderSend(encoded: string) {
    const requestId = this.#requestIds++;
    const result = await this.sender.send(encoded, this.toSessionId!);
    return { ...result, requestId };
  }

  async send<T extends MessageValueType>(
    msg: T,
  ): Promise<SendResponse & { requestId: number }> {
    if (!this.toSessionId) {
      throw this.notInitializedError();
    }
    const plaintext = this.format.encode(msg);
    const encrypted = await this.cryptoContext.seal(plaintext);
    const encoded = this.wireFormat.encodeEnvelope(encrypted);
    return this.senderSend(encoded);
  }

  protected notInitializedError() {
    return new Error("Not initialized");
  }
}

export interface SessionCreator<
  MessageValueType extends ObjectValue = ObjectValue,
  BaseSessionType extends Session<MessageValueType> = Session<MessageValueType>,
  SessionType = ConnectedSession<
    MessageValueType,
    BaseSessionType
  >,
> {
  createInvite(): Promise<string>;
  waitForJoin(
    invite: string,
    handleEvent?: (e: SessionEventValues<MessageValueType>) => void,
  ): Promise<
    {
      joinMessage: MessageValueType;
      session: SessionType;
    }
  >;
  joinWithInvite(
    invite: string,
    joinMessage: MessageValueType,
  ): Promise<ConnectedSession<MessageValueType, BaseSessionType>>;
}

export class EncryptedSessionCreator<
  MessageValueType extends ObjectValue = ObjectValue,
  BaseSessionType extends Session<MessageValueType> = EncryptedSession<
    MessageValueType
  >,
> implements SessionCreator<MessageValueType, BaseSessionType> {
  #inviteContext: Map<string, InitiatorCryptoContext> = new Map();

  constructor(
    protected readonly transportCreator: TransportCreator =
      new HttpTransportCreator(),
    protected readonly identity: Identity = new DecentralizedIdentity(),
  ) {
  }

  protected createInitiatorSession(initiator: InitiatorCryptoContext) {
    return new EncryptedSession<MessageValueType>(
      initiator,
      this.transportCreator.createReceiverTransport(),
      this.transportCreator.createSenderTransport(),
    );
  }
  protected createJoinerSession(joiner: JoinerCryptoContext) {
    return new EncryptedSession<MessageValueType>(
      joiner,
      this.transportCreator.createReceiverTransport(),
      this.transportCreator.createSenderTransport(),
    );
  }

  public async createInvite() {
    const initiator = new InitiatorCryptoContext();
    const { serializedPublicKey: ipk } = await initiator.init();
    const encodedPk = this.identity.encode(new Uint8Array(ipk));
    this.#inviteContext.set(encodedPk, initiator);
    return encodedPk;
  }

  public async waitForJoin(
    invite: string,
    handleEvent?: (e: SessionEventValues<MessageValueType>) => void,
  ): Promise<
    {
      joinMessage: MessageValueType;
      session: ConnectedSession<MessageValueType, BaseSessionType>;
    }
  > {
    const initiator = this.#inviteContext.get(invite);
    if (!initiator) {
      throw new Error("Invite not found");
    }
    const session = this.createInitiatorSession(initiator);
    let result: MessageValueType;
    for await (const evt of session.waitForJoin()) {
      if (evt.type === SessionEventType.handshake) {
        result = evt.detail;
        break;
      }
      if (handleEvent) {
        handleEvent(evt);
      }
    }
    return {
      joinMessage: result!,
      session: this.#asConnectedSession(session),
    };
  }

  public async joinWithInvite(
    invite: string,
    joinMessage: MessageValueType,
  ): Promise<ConnectedSession<MessageValueType, BaseSessionType>> {
    const joiner = new JoinerCryptoContext();
    const joinerSession = this.createJoinerSession(joiner);
    const pk = this.identity.decode(invite);
    await joinerSession.join(pk, joinMessage);
    return this.#asConnectedSession(joinerSession);
  }

  #isSessionConnected(
    session: Session<MessageValueType>,
  ): session is ConnectedSession<MessageValueType, BaseSessionType> {
    if (!("sessionId" in session) || !("toSessionId" in session)) {
      return false;
    }
    return true;
  }
  #asConnectedSession(
    session: Session<MessageValueType>,
  ): ConnectedSession<MessageValueType, BaseSessionType> {
    if (!this.#isSessionConnected(session)) {
      throw new Error("bad session");
    }
    return session;
  }
}

export class EncryptedSessionWithReplay<MessageValueType extends ObjectValue>
  extends EncryptedSession<MessageValueType> {
  #requestCache: Map<number, string> = new Map();

  protected async senderSend(encoded: string) {
    const result = await super.senderSend(encoded);
    this.#requestCache.set(result.requestId, encoded);
    return result;
  }

  clearCache(requestIds: number[]): void {
    for (const id of requestIds) {
      this.#requestCache.delete(id);
    }
  }
  async resendFromCache(requestIds: number[]): Promise<void> {
    if (!this.toSessionId) {
      throw this.notInitializedError();
    }
    for (const requestId of requestIds) {
      const encoded = this.#requestCache.get(requestId);
      if (encoded) {
        await this.sender.send(encoded, this.toSessionId);
      }
    }
  }
}

export class EncryptedSessionWithReplayCreator<
  MessageValueType extends ObjectValue = ObjectValue,
  BaseSessionType extends EncryptedSessionWithReplay<MessageValueType> =
    EncryptedSessionWithReplay<
      MessageValueType
    >,
> extends EncryptedSessionCreator<MessageValueType, BaseSessionType> {
  protected createInitiatorSession(initiator: InitiatorCryptoContext) {
    return new EncryptedSessionWithReplay<MessageValueType>(
      initiator,
      this.transportCreator.createReceiverTransport(),
      this.transportCreator.createSenderTransport(),
    );
  }
  protected createJoinerSession(joiner: JoinerCryptoContext) {
    return new EncryptedSessionWithReplay<MessageValueType>(
      joiner,
      this.transportCreator.createReceiverTransport(),
      this.transportCreator.createSenderTransport(),
    );
  }
}
