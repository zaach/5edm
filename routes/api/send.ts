export const handler = {
  async POST(req: Request): Promise<Response> {
    const body = (await req.text());
    const channelId = new URL(req.url).searchParams.get("channelId");

    if (typeof channelId !== "string") {
      return new Response("invalid body", { status: 400 });
    }
    if (typeof body !== "string" || !body.length) {
      return new Response("invalid body", { status: 400 });
    }

    const channel = new BroadcastChannel(channelId);
    channel.postMessage(body);
    channel.close();

    return new Response("message sent");
  },
};
