import { IS_BROWSER } from "$fresh/runtime.ts";
import { computed, effect, Signal, signal } from "@preact/signals";
import { createContext } from "preact";
import {
  ChatContext,
  ChatEvent,
  ChatEventType,
  MessageType,
} from "./client/mod.ts";
import { Message } from "./types.ts";

type AppStateData = ReturnType<typeof createAppState>;
export const AppState = createContext<AppStateData>(undefined!);

export enum ConnectionStatus {
  disconnected = "disconnected",
  connecting = "connecting",
  connected = "connected",
}

export enum ChatStatus {
  uninitialized,
  active,
  idle,
  disconnected,
  error,
}

export function createAppState() {
  const { eventTarget, chatContext } = ChatContext.createEncryptedChatContext();

  const username = signal(
    IS_BROWSER && localStorage?.getItem("username") || "",
  );

  if (IS_BROWSER) {
    effect(() =>
      username.value && localStorage.setItem("username", username.value)
    );
  }

  effect(() => username.value && chatContext.setUsername(username.value));

  const joinLink = signal("");
  const connectionStatus = signal(ConnectionStatus.disconnected);
  const chatStatus = signal(ChatStatus.uninitialized);
  const partnerUsername = signal("");

  const chatReady = computed(() =>
    chatStatus.value !== ChatStatus.uninitialized
  );

  ChatEvent.addTypedListener(eventTarget, ChatEventType.invite, (e) => {
    joinLink.value = `${location.origin}/#${e.detail.invite}`;
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.channel_open, () => {
    connectionStatus.value = ConnectionStatus.connected;
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.channel_error, (e) => {
    switch (e.detail.readyState) {
      case EventSource.OPEN: // 1
        connectionStatus.value = ConnectionStatus.connected;
        break;
      case EventSource.CLOSED: // 2
        connectionStatus.value = ConnectionStatus.disconnected;
        break;
      case EventSource.CONNECTING: // 0
      default:
        connectionStatus.value = ConnectionStatus.connecting;
        break;
    }
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.initiated, () => {
    chatStatus.value = ChatStatus.active;
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.disconnected, () => {
    chatStatus.value = ChatStatus.disconnected;
    connectionStatus.value = ConnectionStatus.disconnected;
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.message, (e) => {
    chatStatus.value = ChatStatus.active;
    switch (e.detail.type) {
      case MessageType.meta:
        if (e.detail.name) {
          partnerUsername.value = e.detail.name;
          // we're connceted and exchanged meta, prevent a refresh from reloading the invite
          location.hash = "";
        }
        break;
      default:
    }
  });

  return {
    username,
    partnerUsername,
    chatStatus,
    connectionStatus,
    chatReady,
    joinLink,
    chatContext,
    eventTarget,
  };
}

const addMessageFn = (messages: Signal<Message[]>) => (msg: Message) => {
  const lastSeenId = msg.lastSeenId;
  let msgs = messages.value;
  // Mark messages we've sent as `seen` if we receive a message
  // with a greater `lastSeenId`
  if (lastSeenId !== undefined && !msg.self) {
    msgs = msgs.map((m) => {
      const id = m.id;
      if (m.self && id !== undefined && lastSeenId > id) {
        return { ...m, seen: true };
      } else {
        return m;
      }
    });
  }
  if (msg.msg) {
    messages.value = [...msgs, msg];
  } else {
    messages.value = msgs;
  }
};

export function setupMessageListeners(
  eventTarget: EventTarget,
  messages: Signal<Message[]>,
  partnerUsername: Signal<string>,
) {
  const addMessage = addMessageFn(messages);
  const systemMsgId = signal(0);

  ChatEvent.addTypedListener(eventTarget, ChatEventType.message, (e) => {
    if (e.detail.type === MessageType.message) {
      addMessage({
        ...e.detail,
        uid: `i:${e.detail.id}`,
        seen: true,
        time: Date.now(),
        self: false,
      });
    } else if (e.detail.type === MessageType.disconnect) {
      addMessage({
        ...e.detail,
        uid: `i:${e.detail.id}`,
        msg: `${partnerUsername.value} has left the chat`,
        system: true,
        seen: true,
        self: false,
        time: Date.now(),
      });
    } else if (e.detail.lastSeenId) {
      addMessage({ ...e.detail, uid: `i:${e.detail.id}` });
    }
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.queued, (e) => {
    if (e.detail.type === MessageType.message) {
      addMessage({
        ...e.detail,
        uid: `o:${e.detail.id}`,
        seen: false,
        self: true,
      });
    }
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.disconnected, (e) => {
    if (e.detail.local) {
      addMessage({
        uid: `s:${systemMsgId.value++}`,
        msg: "You left the chat",
        system: true,
        self: true,
        time: Date.now(),
      });
    }
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.dead_session, () => {
    addMessage({
      uid: `s:${systemMsgId.value++}`,
      msg: "The session may have died! Refresh to start a new one.",
      system: true,
      self: true,
      time: Date.now(),
    });
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.idle, () => {
    addMessage({
      uid: `s:${systemMsgId.value++}`,
      msg:
        `${partnerUsername.value} may have gone offline. Refresh to start a new session.`,
      system: true,
      self: true,
      time: Date.now(),
    });
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.sent, (e) => {
    console.log("sent", e);
  });
  ChatEvent.addTypedListener(eventTarget, ChatEventType.failed, (e) => {
    console.log("failed", e);
  });
}
