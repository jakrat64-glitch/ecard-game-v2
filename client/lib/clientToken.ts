const STORAGE_KEY = "ecard_client_token";

/**
 * Returns a stable per-browser identity token, creating and persisting one
 * on first use. The server uses this (see server/src/game/MatchManager.ts)
 * to enforce "a player cannot open different games from the same browser" —
 * it's intentionally NOT tied to the Socket.io connection id, since that
 * changes on every reconnect/tab-refresh, which would defeat the purpose.
 *
 * This is a client-side convenience identifier, not a security credential —
 * it can't be used to impersonate another browser's game since the server
 * only uses it to refuse a SECOND concurrent room from the same token, never
 * to grant access to someone else's game state.
 */
export function getClientToken(): string {
  if (typeof window === "undefined") {
    // SSR guard — should never actually be read at this point, but keeps
    // this function safe to call from a component's initial render.
    return "";
  }

  let token = window.localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = generateToken();
    window.localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

function generateToken(): string {
  // crypto.randomUUID is available in all modern browsers Next.js 14 targets.
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers.
  return `token-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
