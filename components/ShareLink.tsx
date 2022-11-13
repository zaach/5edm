import { qrcode } from "https://raw.githubusercontent.com/denorg/qrcode/master/mod.ts";
import { useCallback, useContext, useEffect } from "preact/hooks";
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
          text: "DM me discretely on 5EDM",
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
  // prefetch to warm up the server
  useEffect(() => {
    fetch(ELIZA_URL, { method: "get", mode: "no-cors" });
  }, []);

  const hasEliza = !!ELIZA_URL;

  return (
    <div class="self-center max-w-xs flex flex-col align-items-center">
      <h3 class="font-bold text-lg mb-2">Share this link to DM discretely</h3>

      <div class="space-2 pb-0">
        <div class="form-control">
          <label class="input-group input-group-sm">
            <input
              type="text"
              placeholder="initializing..."
              class="input input-bordered focus:outline-none input-sm w-full"
              value={joinLink.value}
              onClick={(event) => event.currentTarget.select()}
              readonly
            />

            {hasShare ? (
              <button
                class="opacity:2 btn btn-sm btn-circle self-center"
                onClick={onShare}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                  />
                </svg>
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
                      d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                    />
                  </svg>
                ) : (
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
                      d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
                    />
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
            Or chat with{" "}
            <a onClick={onEliza} class="btn btn-xs" href="#">
              ELIZA🤖
            </a>
          </>
        )}
      </p>
    </div>
  );
}
