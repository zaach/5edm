import { computed } from "@preact/signals";
import { useCallback, useContext } from "preact/hooks";
import { ChatContext } from "/app/client/mod.ts";
import { ConnectionStatus, ChatStatus, AppState } from "/app/state.ts";

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
              class=" btn btn-sm normal-case max-w-full flex-nowrap inline-flex"
            >
              <svg
                id="i-lock"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                width="16"
                height="16"
                fill="none"
                stroke="currentcolor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                class="mr-1"
              >
                <path d="M5 15 L5 30 27 30 27 15 Z M9 15 C9 9 9 5 16 5 23 5 23 9 23 15 M16 20 L16 23" />
                <circle cx="16" cy="24" r="1" />
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
          <span class="truncate">{username}</span>
          <svg
            class="ml-1 w-5 h-5 text-gray-500 origin-center cursor-pointer"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
          >
            {" "}
            <g>
              {" "}
              <path fill="none" d="M0 0h24v24H0z" />{" "}
              <path
                fill="currentColor"
                d="M5.334 4.545a9.99 9.99 0 0 1 3.542-2.048A3.993 3.993 0 0 0 12 3.999a3.993 3.993 0 0 0 3.124-1.502 9.99 9.99 0 0 1 3.542 2.048 3.993 3.993 0 0 0 .262 3.454 3.993 3.993 0 0 0 2.863 1.955 10.043 10.043 0 0 1 0 4.09c-1.16.178-2.23.86-2.863 1.955a3.993 3.993 0 0 0-.262 3.455 9.99 9.99 0 0 1-3.542 2.047A3.993 3.993 0 0 0 12 20a3.993 3.993 0 0 0-3.124 1.502 9.99 9.99 0 0 1-3.542-2.047 3.993 3.993 0 0 0-.262-3.455 3.993 3.993 0 0 0-2.863-1.954 10.043 10.043 0 0 1 0-4.091 3.993 3.993 0 0 0 2.863-1.955 3.993 3.993 0 0 0 .262-3.454zM13.5 14.597a3 3 0 1 0-3-5.196 3 3 0 0 0 3 5.196z"
              />{" "}
            </g>{" "}
          </svg>
        </label>
      </div>
    </div>
  );
}
