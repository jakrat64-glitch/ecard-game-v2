import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

let socketInstance: Socket | null = null;

/**
 * Lazily-created singleton Socket.io client. We avoid creating the
 * connection at module-eval time (SSR safety) — it's only instantiated the
 * first time a client component actually asks for it.
 */
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      // Let Socket.io negotiate polling -> websocket upgrade automatically
      // rather than forcing websocket-only. Forcing websocket-only fails
      // hard in some proxied/sandboxed network environments that block or
      // mangle the WS upgrade handshake; polling-first with upgrade is the
      // more portable default and degrades gracefully.
    });
  }
  return socketInstance;
}
