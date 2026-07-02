import type { Connector, ContextObjectInput } from "./types";

/**
 * Coda connector — token API, read-only.
 * Lists your docs, exports each page as markdown, ingests as context objects.
 *
 * One-time setup: create an API token at coda.io/account → CODA_API_TOKEN.
 */

const API = "https://coda.io/apis/v1";
const MAX_DOCS = 15;
const MAX_PAGES_PER_DOC = 25;
const EXPORT_POLL_MS = 1200;
const EXPORT_POLL_TRIES = 8;

async function codaGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${process.env.CODA_API_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Coda ${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface CodaD