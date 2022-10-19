import { IS_BROWSER } from "$fresh/runtime.ts";
import { useCallback, useEffect, useRef, useContext } from "preact/hooks";
import { computed, useSignal, effect } from "@preact/signals";
import {
  AppState,
  ConnectionStatus,
  ChatStatus,
  createAppState,
  setupMessageListeners,
} from "/app/state.ts";

import { Message, DisplayMessage } from "/app/types.ts";
import { ShareLink } from "/components/ShareLink.tsx";
import { UpdateUsernameDialog } from "/components/UpdateUsernameDialog.tsx";
import { Header } from "/components/Header.tsx";
import { MessageBox } from "/components/Messages.tsx";

export default function ChatWrapper() {
  return (
    <AppState.Provider value={createAppState()}>
      <Chat />
    </AppState.Provider>
  );
}

export function Chat() {
  const { username, chatContext, connectionStatus } = useContext(AppState);
  const setUser = (name: string) => {
    username.value = name;
  };

  effect(() => {
    if (IS_BROWSER && username.value) {
      const invite = location.hash?.slice(1);
      if (invite) {
        chatContext.joinWithInvite(invite);
      } else {
        connectionStatus.value = ConnectionStatus.connecting;
        chatContext.createInviteAndWait();
      }
    }
  });

  return (
    <div
      class="flex flex-col h-full dark:bg-base-300 overflow-hidden"
      tabIndex={99}
    >
      <Header chatContext={chatContext} />
      <ChatHistory />
      <SendField />
      <UpdateUsernameDialog user={username.value} setUser={setUser} />
    </div>
  );
}

function ChatHistory() {
  const { chatReady, eventTarget, partnerUsername } = useContext(AppState);
  const messages = useSignal<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setupMessageListeners(eventTarget, messages, partnerUsername);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView(false);
  }, [messages.value.length]);

  const displayMessages = computed(
    () => messages.value.filter((m) => !!m.msg) as DisplayMessage[]
  );

  return (
    <div class="grow relative w-full p-4 overflow-y-auto">
      {chatReady.value ? (
        <ul>
          {displayMessages.value.map((m) => (
            <MessageBox {...m} />
          ))}
          <div ref={bottomRef} />
        </ul>
      ) : (
        <div class="grow w-full h-full flex place-content-center">
          <ShareLink />
        </div>
      )}
    </div>
  );
}

function SendField() {
  const { chatStatus, chatContext } = useContext(AppState);
  const message = useSignal("");
  const inputRef = useRef<HTMLInputElement>(null);

  const disabled = computed(
    () =>
      chatStatus.value === ChatStatus.uninitialized ||
      chatStatus.value === ChatStatus.disconnected
  );

  const onSubmit = useCallback(
    (e: Event) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!disabled.value) {
        if (message.value === "/bye") {
          chatContext.disconnect();
        } else {
          const msg = {
            msg: message.value,
          };
          chatContext.send(msg);
        }
        message.value = "";
      }
    },
    [message.value, disabled.value]
  );

  return (
    <div class="sticky pwa:pb-10 bottom-0 bg-base-200 self-end items-center justify-between w-full p-3">
      <form class="flex" onSubmit={onSubmit}>
        <div class="input inline-flex w-full">
          <input
            type="text"
            placeholder="Message"
            value={message.value}
            onInput={(e) => (message.value = e.currentTarget.value)}
            class="transition input input-ghost focus:fg-content placeholder:text-gray-600 focus:placeholder:text-gray-500 focus:outline-none grow pl-0 disabled:bg-transparent disabled:border-0"
            autocomplete="off"
            ref={inputRef}
            disabled={disabled.value}
            required
          />
          <button type="submit" disabled={disabled.value}>
            <svg
              class="w-5 h-5 transition hover:text-gray-400 text-gray-500 origin-center transform rotate-90 ml-3"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
