import { qrcode } from "https://raw.githubusercontent.com/denorg/qrcode/master/mod.ts";
import { useCallback, useContext } from "preact/hooks";
import { useSignal, effect } from "@preact/signals";
import { AppState } from "../app/state.ts";

const ELIZA_URL = globalThis.ENV?.ELIZA_URL;

export function ShareLink() {
  const { joinLink } = useContext(AppState);
  const linkShared = useSignal(false);
  const hasShare = "share" in navigator;
  const qr = useSignal("");

  effect(() => {
    qrcode(joinLink.value, { size: 194 }).then((val) => (qr.value = val));
  });

  const onShare = useCallback(() => {
    if (hasShare) {
      navigator
        .share({
          title: "5EDM",
          text: "DM me on 5EDM",
          url: joinLink.value,
        })
        .then(() => (linkShared.value = true))
        .catch((error) => console.log("Error sharing", error));
    }
  }, [joinLink.value]);

  const onEliza = useCallback(() => {
    return fetch(`${ELIZA_URL}/`, {
      mode: "no-cors",
      method: "POST",
      body: JSON.stringify({ invite: joinLink.value }),
    });
  }, [joinLink.value]);

  const hasEliza = !!ELIZA_URL;

  return (
    <div class="self-center max-w-xs flex flex-col align-items-center">
      <h3 class="font-bold text-lg mb-2">Send this link to DM discretely</h3>

      <div class="space-2 pb-0">
        <div class="form-control">
          <label class="input-group input-group-sm">
            <input
              type="text"
              placeholder="initiating..."
              class="input input-bordered focus:outline-none input-sm w-full"
              value={joinLink.value}
              onClick={(event) => event.currentTarget.select()}
              readonly
            />

            {hasShare ? (
              <button
                class="opacity:2 p-1 btn btn-sm btn-circle self-center"
                onClick={onShare}
              >
                <img class="opacity:10 hover:opacity:80" src="share.svg" />
              </button>
            ) : (
              <button
                class="btn btn-sm"
                onClick={() => {
                  linkShared.value = true;
                  navigator.clipboard.writeText(joinLink.value);
                }}
              >
                {linkShared.value ? (
                  <svg
                    id="i-checkmark"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentcolor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="4"
                  >
                    <path d="M2 20 L12 28 30 4" />
                  </svg>
                ) : (
                  <svg
                    id="i-clipboard"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentcolor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                  >
                    <path d="M12 2 L12 6 20 6 20 2 12 2 Z M11 4 L6 4 6 30 26 30 26 4 21 4" />
                  </svg>
                )}
              </button>
            )}
          </label>
        </div>
      </div>
      <div class="divider">OR</div>
      <div class="self-center rounded-lg overflow-hidden">
        {qr.value ? (
          <img src={qr.value} />
        ) : (
          <div class="animate-pulse dark:bg-base-100 bg-slate-200 w-48 h-48" />
        )}
      </div>
      <p class="self-center rounded-lg overflow-hidden mt-10 text-xs h-8">
        {hasEliza && (
          <>
            Don't have friends? Chat with{" "}
            <a onClick={onEliza} class="btn btn-xs" href="#">
              ELIZA🤖
            </a>
          </>
        )}
      </p>
    </div>
  );
}
