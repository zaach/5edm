import { useState, useCallback, useContext } from "preact/hooks";
import { computed } from "@preact/signals";
import { AppState } from "/app/state.ts";

export function UpdateUsernameDialog(props: {
  user: string;
  setUser: (str: string) => void;
}) {
  const { username, chatReady } = useContext(AppState);
  const [local, setLocal] = useState(props.user);
  const ref = useCallback(
    (node: HTMLInputElement | null) => {
      if (node && !username.value) {
        node.checked = true;
      }
    },
    [username.value]
  );
  const title = computed(() =>
    chatReady.value ? "Update your username" : "Pick a username"
  );
  return (
    <>
      <input
        ref={ref}
        type="checkbox"
        id="username-modal"
        class="modal-toggle"
      />
      <div class="modal modal-middle">
        <div class="modal-box">
          <h3 class="font-bold text-lg">{title}</h3>
          <p class="py-4">
            <input
              title="Username"
              autocomplete="off"
              placeholder="alice"
              type="text"
              class="input placeholder:text-gray-600 focus:placeholder:text-gray-500 w-full input-bordered focus:outline-none focus:ring focus:border-gray-500"
              value={local}
              onInput={(e) => setLocal(e.currentTarget.value)}
            />
          </p>
          <div class="modal-action">
            <label
              for="username-modal"
              class="btn btn-secondary disabled:opacity-50"
              disabled={local.length === 0}
              onClick={(e) => {
                if (local) {
                  props.setUser(local);
                } else {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              Done
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
