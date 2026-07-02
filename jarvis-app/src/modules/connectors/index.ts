// Relative import (not "@/lib/db") so this module also works under tsx in scripts/pull.ts
import { query } from "../../lib/db";
import type { Connector, ContextObjectInput } from "./types";
import { obsidianConnector } from "./obsidian";
import { outlookConnector } from "./outlook";
import { zohoConnector } from "./zoho";
import { codaConnector } from "./coda";

export const connectors: Connector[] = [
  obsidianConnector,
  outlookConnector,
  zohoConnector,
  codaConnector,
];

export async function upsertContextObject(item: ContextObjectInput): Promise<void> {
  await query(
    `INSERT INTO context_objects (source, external_id, kind, title, body, url, people, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (source, external_id) DO UPDATE SET
       kind = EXCLUDED.kind,
       title = EXCLUDED.title,
       body = EXCLUDED.body,
       url = EXCLUDED.url,
       people = EXCLUDED.people,
       occurred_at = EXCLUDED.occurred_at,
       ingested_at = now()`,
    [
      item.source,
      item.externalId,
      item.kind,
      item.title,
      item.body,
      item.url ?? null,
      item.people ?? [],
      item.occurredAt ?? null,
    ]
  );
}

/** Run every configured connector; returns counts per source. */
export async function runAllConnectors(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const c of connectors) {
    if (!c.configured()) {
      counts[c.name] = -1; // not configured
      continue;
    }
    const items = await c.pull();
    for (const item of items) await upsertContextObject(item);
    counts[c.name] = items.length;
  }
  return counts;
}
