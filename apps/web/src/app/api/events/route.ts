import { NextRequest } from "next/server";

// Global SSE listener registry
if (!(globalThis as any).__sseListeners) {
  (globalThis as any).__sseListeners = new Map<string, Set<(data: string) => void>>();
}
const listeners = (globalThis as any).__sseListeners as Map<string, Set<(data: string) => void>>;

// GET /api/events?request_id=xxx - SSE stream
export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get("request_id") || "";
  if (!requestId) {
    return new Response("request_id required", { status: 400 });
  }
  const reqId: string = requestId;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Register listener
      if (!listeners.has(reqId)) {
        listeners.set(reqId, new Set());
      }

      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          cleanup();
        }
      };

      listeners.get(reqId)!.add(send);

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          cleanup();
        }
      }, 30000);

      send(JSON.stringify({ type: "connected", request_id: reqId }));

      function cleanup() {
        clearInterval(heartbeat);
        listeners.get(reqId)?.delete(send);
        if (listeners.get(reqId)?.size === 0) {
          listeners.delete(reqId);
        }
      }

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
