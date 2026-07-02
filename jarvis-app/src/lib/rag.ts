import { query } from "./db";

/**
 * RAG-lite — retrieval over the unified context store.
 * Alpha uses Postgres full-text search (zero extra infra, surprisingly good).
 * Phase 2+: populate the `embedding` column and switch to hybrid search.
 */

export interface ContextHit {
  id: number;
  source: string;
  kind: string;
  title: string;
  body: string;
  url: string | null;
  occurred_at: string | null;
}

export async function search(q: string, limit = 8): Promise<ContextHit[]> {
  return query<ContextHit & Record<string, unknown>>(
    `SELECT id, source, kind, title, body, url, occurred_at::text
     FROM context_objects
     WHERE search_tsv @@ plainto_tsquery('english', $1)
     ORDER BY ts_rank(search_tsv, plainto_tsquery('english', $1)) DESC,
              occurred_at DESC NULLS LAST
     LIMIT $2`,
    [q, limit]
  ) as Promise<ContextHit[]>;
}

export async function recent(hours = 48, limit = 20): Promise<ContextHit[]> {
  return query<ContextHit & Record<string, unknown>>(
    `SELECT id, source, kind, title, body, url, occurred_at::text
     FROM context_objects
     WHERE occurred_at > now() - ($1 || ' hours')::interval
        OR ingested_at > now() - ($1 || ' hours')::interval
     ORDER BY occurred_at DESC NULLS LAST
     LIMIT $2`,
    [String(hours), limit]
  ) as Promise<ContextHit[]>;
}

export function hitsToPrompt(hits: ContextHit[]): string {
  if (hits.length === 0) return "No matching context found.";
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] (${h.source}/${h.kind}) ${h.title}${h.occurred_at ? ` — ${h.occurred_at}` : ""}\n${h.body.slice(0, 1500)}`
    )
    .join("\n\n");
}
