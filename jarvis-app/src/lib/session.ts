/**
 * Session tokens — edge- and node-safe (Web Crypto only, no dependencies).
 * The token is an HMAC of a fixed label under SESSION_SECRET, so it can be
 * verified statelessly in middleware. Single-user by design; real multi-user
 * auth (per-user sessions, OAuth) is a Phase 4 concern.
 */

export const SESSION_COOKIE = "jarvis_session";

const encoder = new TextEncoder();

export async function sessionToken(): Promise<string> {
  const secret = process.env.SESSION_SECRET || process.env.APP_PASSWORD;
  if (!secret) throw new Error("SESSION_SECRET (or APP_PASSWORD) must be set");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode("jarvis-session-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
