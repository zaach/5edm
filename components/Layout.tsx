import { Head } from "$fresh/runtime.ts";
import { ComponentChildren } from "preact";
import { EnvScript } from "./EnvScript.tsx";

interface Props {
  children: ComponentChildren;
}

const ENV_KEYS = ["ELIZA_URL"];

const Layout = ({ children }: Props) => {
  return (
    <>
      <Head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/favicon.png"/>
        {/* Tailwind Stylesheet */}
        <link rel="stylesheet" href="/styles.css" />
        <EnvScript keys={ENV_KEYS} />
      </Head>
      <main class="h-full">{children}</main>
    </>
  );
};

export { Layout };
