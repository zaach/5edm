import { ComponentChildren } from "preact";
import { DisplayMessage } from "../app/types.ts";

type Expanded = string | { img: string; ltr: boolean };

const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})+$/u;

const expandables: Record<string, Expanded> = {
  "~=[,,_,,]:3": { img: "/expand/nyan-cat.gif", ltr: true },
  "/nyan": { img: "/expand/nyan-cat.gif", ltr: true },
  "/ryu": { img: "/expand/ryu.gif", ltr: false },
  "/ken": { img: "/expand/ken.gif", ltr: true },
};

function expandMessage(msg: string, isSelf: boolean) {
  if (msg in expandables) {
    const mapped = expandables[msg];
    if (typeof mapped === "string") {
      msg = mapped;
    } else {
      const orient =
        (mapped.ltr && isSelf) || (!mapped.ltr && !isSelf)
          ? "-scale-x-100"
          : "";
      return <img src={mapped.img} class={`${orient} max-h-32`} />;
    }
  }
  if (typeof msg === "string" && EMOJI_REGEX.test(msg)) {
    return <EmojiMessage msg={msg} />;
  }
  return isSelf ? SelfBubble(msg) : PartnerBubble(msg);
}

export function MessageBox(message: DisplayMessage) {
  if (message.system) {
    return SystemMessage(message);
  }
  const expanded = expandMessage(message.msg, !!message.self);
  return message.self ? (
    <SelfMessage message={message}>{expanded}</SelfMessage>
  ) : (
    <OtherMessage message={message}>{expanded}</OtherMessage>
  );
}

function SelfBubble(text: string) {
  return (
    <div class="relative sm:max-w-xl max-w-[80%] px-4 py-2 text-white bg-info rounded-lg rounded-br-none">
      <span class="block">{text}</span>
    </div>
  );
}

function PartnerBubble(text: string) {
  return (
    <div class="relative sm:max-w-xl max-w-[80%] px-4 py-2 dark:text-white fg-base-content dark:bg-gray-700 bg-base-200 rounded-lg rounded-bl-none">
      <span class="block">{text}</span>
    </div>
  );
}

export function SystemMessage({ msg, uid }: DisplayMessage) {
  return (
    <li
      id={uid}
      data-author="self"
      class={`flex justify-center my-4 text-gray-400 italic text-center`}
    >
      {msg}
    </li>
  );
}

interface MessageProps {
  message: DisplayMessage;
  children: ComponentChildren;
}
export function SelfMessage({ message, children }: MessageProps) {
  const seenStyle = message.seen ? "" : "opacity-90";
  return (
    <li
      id={message.uid}
      data-author="self"
      class={`${seenStyle} peer flex justify-end peer-change-self:mt-4`}
    >
      {children}
    </li>
  );
}

export function OtherMessage({ message, children }: MessageProps) {
  return (
    <li
      id={message.uid}
      data-author="other"
      class="peer flex justify-start peer-change-other:mt-4"
    >
      {children}
    </li>
  );
}

function EmojiMessage({ msg }: { msg: string }) {
  const len = [...msg].length;
  const sizeClass = len <= 6 ? "text-6xl py-5" : "";
  return (
    <div class={`relative px-4 py-2 ${sizeClass}`}>
      <span class="block">{msg}</span>
    </div>
  );
}
