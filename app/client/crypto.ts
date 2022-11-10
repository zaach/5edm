import * as hpke from "https://raw.githubusercontent.com/zaach/hpke-js/main/mod.ts";

const { Kem, Kdf, Aead, CipherSuite } = hpke;

const EMPTY_SALT = new Uint8Array(0);
const LABEL_CHANNEL_ID = new TextEncoder().encode("channel_id");
const EXPORT_LABEL_NONCE = new TextEncoder().encode("5edm nonce");
const EXPORT_LABEL_KEY = new TextEncoder().encode("5edm key");
const EXPORT_LABEL_SESSIONID = new TextEncoder().encode("5edm session id");

export interface Envelope {
  // header: channelid
  header: ArrayBuffer;
  // payload: ciphertext
  payload: ArrayBuffer;
}
export interface HandshakeEnvelope {
  // header: context and ciphertext
  header: [ArrayBuffer, ArrayBuffer];
  // payload: context and ciphertext
  payload: [ArrayBuffer, ArrayBuffer];
}

const concatBuffers = function (buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

export abstract class Encrypter {
  sessionId?: ArrayBuffer;
  toSessionId?: ArrayBuffer;
  protected context?: hpke.EncryptionContextInterface;

  constructor(
    protected suite = new CipherSuite({
      kem: Kem.DhkemX25519HkdfSha256,
      kdf: Kdf.HkdfSha256,
      aead: Aead.Aes256Gcm,
    }),
  ) {}

  async seal(
    bytes: ArrayBuffer,
    additionalData?: ArrayBuffer,
  ): Promise<Envelope> {
    if (!this.context || !this.toSessionId) {
      throw new Error("CryptoContext not initialized");
    }
    const ad = additionalData
      ? concatBuffers(this.toSessionId, additionalData)
      : this.toSessionId;
    return {
      header: ad,
      payload: await this.context.seal(bytes, ad),
    };
  }

  async open(
    bytes: ArrayBuffer,
    header: ArrayBuffer,
    additionalData?: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    if (!this.context) {
      throw new Error("CryptoContext not initialized");
    }
    const ad = additionalData ? concatBuffers(header, additionalData) : header;
    try {
      const result = await this.context.open(bytes, ad);
      return result;
    } catch (err) {
      console.log("failed to decrypt.", err);
      throw err;
    }
  }

  protected async deriveChannelId(pubkey: ArrayBuffer): Promise<ArrayBuffer> {
    const kdf = await this.suite.kdfContext();
    const raw = await kdf.labeledExtract(
      EMPTY_SALT,
      LABEL_CHANNEL_ID,
      new Uint8Array(pubkey),
    );
    // use first 16 bits of hashed public key
    const truncated = new Uint8Array(16);
    truncated.set(new Uint8Array(raw, 0, 16));
    return truncated.buffer;
  }
}

export class InitiatorCryptoContext extends Encrypter {
  #keypair?: CryptoKeyPair;
  handshakeChannelId?: ArrayBuffer;
  //#joinerPublicKey?: CryptoKey;

  // Create a stable keypair for this instance
  async init(): Promise<
    { serializedPublicKey: ArrayBuffer; handshakeChannelId: ArrayBuffer }
  > {
    this.#keypair = await this.suite.generateKeyPair();
    // serialize publicKey for sharing
    const serializedPublicKey = await this.suite.serializePublicKey(
      this.#keypair,
    );
    const handshakeChannelId = await this.deriveChannelId(serializedPublicKey);
    this.handshakeChannelId = handshakeChannelId;
    return { serializedPublicKey, handshakeChannelId };
  }

  async handleJoin(
    envelope: HandshakeEnvelope,
  ): Promise<
    {
      plaintext: ArrayBuffer;
      sessionId: ArrayBuffer;
      toSessionId: ArrayBuffer;
    }
  > {
    if (!this.#keypair) {
      throw new Error("CryptoContext not initialized");
    }

    const [
      senderPkContext,
      senderPkCiphertext,
    ] = envelope.header;
    const [
      senderInitContext,
      senderInitCiphertext,
    ] = envelope.payload;

    let senPubKeyRaw;
    try {
      senPubKeyRaw = await this.suite.open(
        {
          recipientKey: this.#keypair,
          enc: senderPkContext,
        },
        senderPkCiphertext,
        senderInitCiphertext,
      );
    } catch (err) {
      console.log("failed to decrypt sender public key.", err);
      throw err;
    }
    if (!senPubKeyRaw) {
      throw new Error("Could not decrypt handshake payload");
    }

    const senderPublicKey = await this.suite.deserializePublicKey(senPubKeyRaw);

    const recipient = await this.suite.createRecipientContext({
      recipientKey: this.#keypair,
      enc: senderInitContext,
      senderPublicKey: senderPublicKey,
    });

    const keySeed = await recipient.export(EXPORT_LABEL_KEY, 32);
    const nonceSeed = await recipient.export(EXPORT_LABEL_NONCE, 32);
    const sessionId = await recipient.export(EXPORT_LABEL_SESSIONID, 16);
    const toSessionId = await recipient.export(EXPORT_LABEL_SESSIONID, 16);
    await recipient.setupBidirectional(
      keySeed,
      nonceSeed,
    );

    this.context = recipient;
    this.sessionId = sessionId;
    this.toSessionId = toSessionId;

    // decrypt
    let plaintext = new ArrayBuffer(0);
    try {
      plaintext = await this.context.open(
        senderInitCiphertext,
        this.handshakeChannelId,
      );
    } catch (err) {
      console.log("failed to decrypt.", err);
      throw err;
    }

    //this.#joinerPublicKey = senderPublicKey;

    return {
      plaintext,
      sessionId,
      toSessionId,
    };
  }
}

export class JoinerCryptoContext extends Encrypter {
  toChannelId?: ArrayBuffer;
  //#keypair?: CryptoKeyPair;
  //#initiatorPublicKey?: CryptoKey;

  async initSender(
    receiverPublicKeyRaw: ArrayBuffer,
    appPayload: ArrayBuffer,
  ): Promise<
    {
      envelope: HandshakeEnvelope;
      toChannelId: ArrayBuffer;
      sessionId: ArrayBuffer;
      toSessionId: ArrayBuffer;
    }
  > {
    const skp = await this.suite.generateKeyPair();
    // import receiver public key received from outside channel
    const recPubKey = await this.suite.deserializePublicKey(
      receiverPublicKeyRaw,
    );

    // setup sender context
    const sender = await this.suite.createSenderContext({
      recipientPublicKey: recPubKey,
      senderKey: skp,
    });

    const toSessionId = await sender.export(EXPORT_LABEL_SESSIONID, 16);
    const sessionId = await sender.export(EXPORT_LABEL_SESSIONID, 16);
    const keySeed = await sender.export(EXPORT_LABEL_KEY, 32);
    const nonceSeed = await sender.export(EXPORT_LABEL_NONCE, 32);

    // setup bidirectional encryption
    await sender.setupBidirectional(
      keySeed,
      nonceSeed,
    );

    const toChannelId = await this.deriveChannelId(receiverPublicKeyRaw);
    this.toChannelId = toChannelId;
    this.sessionId = sessionId;
    this.toSessionId = toSessionId;
    this.context = sender;
    const senderInitCiphertext = await this.context.seal(
      appPayload,
      toChannelId,
    );

    // Create encrypted header containing sender public key
    const serializedPublicKey = await this.suite.serializePublicKey(skp);
    const { ct: senderPkCiphertext, enc: senderPkContext } = await this.suite
      .seal(
        {
          recipientPublicKey: recPubKey,
        },
        serializedPublicKey, // plaintext
        senderInitCiphertext, // use main payload as additional data to bind header to payload
      );

    //this.#initiatorPublicKey = recPubKey;
    //this.#keypair = skp;

    return {
      toChannelId,
      sessionId,
      toSessionId,
      envelope: {
        payload: [
          sender.enc,
          senderInitCiphertext,
        ],
        header: [
          senderPkContext,
          senderPkCiphertext,
        ],
      },
    };
  }
}
