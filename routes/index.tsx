import { Layout } from "../components/Layout.tsx";
import { AboutDialog } from "../components/AboutDialog.tsx";
import Chat from "../islands/Chat.tsx";

export default function Home() {
  return (
    <Layout>
      <Chat />
      <AboutDialog />
    </Layout>
  );
}
