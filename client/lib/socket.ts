import { io, Socket } from "socket.io-client";

function resolveSocketUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.NEXT_PUBLIC_SERVER_URL;

  if (configuredUrl && configuredUrl.trim()) {
    return configuredUrl.trim();
  }

  // Railway serves public domains over 443 only — never name an explicit
  // port here, or the browser will dial a port the edge does not listen on.
  if (typeof window !== "undefined" && window.location.hostname.includes("railway.app")) {
    return "https://ecard-game-server-production.up.railway.app";
  }

  return "http://localhost:4000";
}

const SOCKET_URL = resolveSocketUrl();

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
