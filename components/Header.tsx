import { computed } from "@preact/signals";
import { useCallback, useContext } from "preact/hooks";
import { ChatContext } from "../app/client/mod.ts";
import { ConnectionStatus, ChatStatus, AppState } from "../app/state.ts";

export function Header({ chatContext }: { chatContext: ChatContext }) {
  const { partnerUsername, username, connectionStatus, chatReady, chatStatus } =
    useContext(AppState);

  const badgeState = computed(() => {
    switch (connectionStatus.value) {
      case ConnectionStatus.connecting:
        return "badge-warning";
      case ConnectionStatus.connected:
        return "badge-success";
      case ConnectionStatus.disconnected:
      default:
        return "badge-error";
    }
  });

  const indicatorText = computed(() => {
    switch (connectionStatus.value) {
      case ConnectionStatus.connecting:
        return "Connecting...";
      default:
        return "";
    }
  });

  const disabled = computed(() => {
    return chatStatus.value === ChatStatus.disconnected;
  });

  const onDisconnect = useCallback(() => {
    if (!disabled.value) {
      chatContext.disconnect();
    }
    const elem = document.activeElement;
    if (elem instanceof HTMLElement) {
      elem?.blur();
    }
  }, [disabled.value]);

  return (
    <div class="sticky top-0 grid grid-cols-3 gap-3 w-full z-10 bg-base-200 p-3">
      <div class="basis-1/3">
        <label class="btn btn-sm btn-circle" for="about-modal">
          ?
        </label>
      </div>
      {chatReady.value ? (
        partnerUsername.value ? (
          <div class="dropdown justify-self-center max-w-full flex-nowrap">
            <label
              tabIndex={0}
              class="btn btn-sm normal-case max-w-full flex-nowrap inline-flex"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                width="16"
                height="16"
                class="mr-1"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>

              <span class="truncate">{partnerUsername}</span>
            </label>
            <ul
              tabIndex={0}
              class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <a
                  onClick={onDisconnect}
                  disabled={disabled.value}
                  class="disabled:opacity-50"
                >
                  Disconnect
                </a>
              </li>
            </ul>
          </div>
        ) : (
          <div class="inline-flex items-center btn btn-sm normal-case justify-self-center max-w-full flex-nowrap">
            <svg
              class="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )
      ) : (
        <div></div>
      )}
      <div class="indicator justify-self-end max-w-full">
        <span
          class={`indicator-item indicator-end badge badge-xs ${badgeState.value}`}
        >
          {indicatorText}
        </span>
        <label
          class="inline-flex items-center btn btn-sm normal-case max-w-full truncate flex-nowrap"
          for="username-modal"
        >
          <span class="truncate mr-1">{username}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"
            />
          </svg>
        </label>
      </div>
    </div>
  );
}
