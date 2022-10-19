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
                <a href="https://signal.org/">Signal</a> if you need the real
                deal.
              </span>
            </div>
          </div>
          <div class="mt-4 text-sm">
            <p class="text-center">
              This is a proof-of-concept app that uses HPKE.js, fresh, and{" "}
              <a href="https://deno.com/deploy">Deno Deploy</a> to facilitate
              end-to-end encrypted messaging between two anonymous parties.
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
