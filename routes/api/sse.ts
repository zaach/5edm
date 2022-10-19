export const handler = {
  GET(_req: Request): Response {
    const url = new URL(_req.url);
    const channelId = url.searchParams.get("channelId") ?? "default";
    const channel = new BroadcastChannel(channelId);

    const stream = new ReadableStream({
      start: (controller) => {
        controller.enqueue(": Welcome to 5EDM\n\n");
        channel.onmessage = (e) => {
          const body = `data: ${e.data}\n\n`;
          controller.enqueue(body);
        };
      },
      cancel() {
        channel.close();
      },
    });

    return new Response(stream.pipeThrough(new TextEncoderStream()), {
      headers: { "content-type": "text/event-stream" },
    });
  },
};
