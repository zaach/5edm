import { Link } from "./Link.tsx";
export function AboutDialog() {
  return (
    <>
      <input type="checkbox" id="about-modal" class="modal-toggle" />

      <label for="about-modal" class="modal cursor-pointer">
        <label class="modal-box relative" for="">
          <div class="relative h-8 flex place-content-center">
            <img src="/5edm.png" class="md:w-40 md:h-10" />
          </div>
          <p class="my-4 text-center text-xs light:fg-gray-500">
            <b>E</b>phemeral, <b>E</b>dge, <b>E</b>nd-to-
            <b>E</b>nd <b>E</b>ncrypted <b>D</b>irect <b>M</b>essaging
          </p>
          <div class="alert p-1 pl-2">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                class="stroke-current flex-shrink-0 w-6 h-6"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span class="text-xs py-1">
                This app is demo-tier! Use{" "}
                <Link href="https://signal.org/">Signal</Link> if you need the
                real deal.
              </span>
            </div>
          </div>
          <div class="mt-4 text-sm">
            <p class="text-center">
              This is a proof-of-concept app that uses{" "}
              <Link href="https://www.rfc-editor.org/rfc/rfc9180.html">
                HPKE
              </Link>
              , <Link href="https://fresh.deno.dev/">fresh</Link>, and{" "}
              <Link href="https://deno.com/deploy">Deno Deploy</Link> to
              facilitate end-to-end encrypted messaging between two anonymous
              parties. No data is persisted or cached on the server so both
              parties should be online for the best experience.
            </p>
            <p class="text-center mt-4 inline-flex items-center gap-2 w-full justify-center">
              <Link href="https://github.com/zaach/5edm">
                Source code{" "}
                <svg
                  id="i-github"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 64 64"
                  width="16"
                  height="16"
                  class="inline-block"
                >
                  <path
                    stroke-width="0"
                    fill="currentColor"
                    d="M32 0 C14 0 0 14 0 32 0 53 19 62 22 62 24 62 24 61 24 60 L24 55 C17 57 14 53 13 50 13 50 13 49 11 47 10 46 6 44 10 44 13 44 15 48 15 48 18 52 22 51 24 50 24 48 26 46 26 46 18 45 12 42 12 31 12 27 13 24 15 22 15 22 13 18 15 13 15 13 20 13 24 17 27 15 37 15 40 17 44 13 49 13 49 13 51 20 49 22 49 22 51 24 52 27 52 31 52 42 45 45 38 46 39 47 40 49 40 52 L40 60 C40 61 40 62 42 62 45 62 64 53 64 32 64 14 50 0 32 0 Z"
                  />
                </svg>
              </Link>
              •{" "}
              <span>
                By{" "}
                <Link href="https://twitter.com/zii">
                  zii
                  <svg
                    id="i-twitter"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 64 64"
                    width="16"
                    height="16"
                  >
                    <path
                      stroke-width="0"
                      fill="currentColor"
                      d="M60 16 L54 17 L58 12 L51 14 C42 4 28 15 32 24 C16 24 8 12 8 12 C8 12 2 21 12 28 L6 26 C6 32 10 36 17 38 L10 38 C14 46 21 46 21 46 C21 46 15 51 4 51 C37 67 57 37 54 21 Z"
                    />
                  </svg>
                </Link>
              </span>
            </p>
          </div>
          <div class="modal-action justify-center">
            <label for="about-modal" class="btn btn-wide">
              okay
            </label>
          </div>
        </label>
      </label>
    </>
  );
}
