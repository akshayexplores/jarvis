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

interface CodaDoc { id: string; name: string; browserLink: string; updatedAt: string }
interface CodaPage { id: string; name: string; browserLink: string; updatedAt: string; contentType?: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Export a page to markdown: begin → poll → download. Returns "" on timeout. */
async function exportPageMarkdown(docId: string, pageId: string): Promise<string> {
  const begin = await fetch(`${API}/docs/${docId}/pages/${pageId}/export`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CODA_API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ outputFormat: "markdown" }),
  });
  if (!begin.ok) return "";
  const { id: requestId } = (await begin.json()) as { id: string };

  for (let i = 0; i < EXPORT_POLL_TRIES; i++) {
    await sleep(EXPORT_POLL_MS);
    const status = await codaGet<{ status: string; downloadLink?: string }>(
      `/docs/${docId}/pages/${pageId}/export/${requestId}`
    );
    if (status.status === "complete" && status.downloadLink) {
      const dl = await fetch(status.downloadLink);
      if (dl.ok) return (await dl.text()).slice(0, 50_000);
      return "";
    }
    if (status.status === "failed") return "";
  }
  return "";
}

export const codaConnector: Connector = {
  name: "coda",

  configured() {
    return Boolean(process.env.CODA_API_TOKEN);
  },

  async pull(): Promise<ContextObjectInput[]> {
    const items: ContextObjectInput[] = [];
    const docs = await codaGet<{ items: CodaDoc[] }>(`/docs?limit=${MAX_DOCS}`);

    for (const doc of docs.items ?? []) {
      let pages: CodaPage[] = [];
      try {
        pages = (await codaGet<{ items: CodaPage[] }>(`/docs/${doc.id}/pages?limit=${MAX_PAGES_PER_DOC}`)).items ?? [];
      } catch (err) {
        console.warn(`[coda] pages for doc ${doc.name} unavailable:`, (err as Error).message);
        continue;
      }

      for (const page of pages) {
        if (page.contentType && page.contentType !== "canvas") continue; // skip embeds etc.
        let body = "";
        try {
          body = await exportPageMarkdown(doc.id, page.id);
        } catch {
          /* export can fail on locked/special pages — ingest metadata anyway */
        }
        items.push({
          source: "coda",
          externalId: `${doc.id}/${page.id}`,
          kind: "doc",
          title: `${doc.name} › ${page.name}`,
          body,
          url: page.browserLink,
          occurredAt: new Date(page.updatedAt || doc.updatedAt),
        });
      }
    }
    return items;
  },
};
