# Jarvis — Personal OS (Phase 0/Alpha)

A workspace that remembers. One interface over Obsidian, Outlook, Zoho Books, and Coda,
built on three modules: **Memory** (durable business facts), **RAG-lite** (retrieval over
a unified context store), and a **Credit System** (every AI call is metered).

See `../JARVIS-ROADMAP.md` for the full product roadmap.

## What's in the Alpha

| Screen | What it does |
|---|---|
| **Daily Brief** (`/`) | AI-generated morning brief: meetings with context, top 3, flags |
| **Ask Jarvis** (`/ask`) | One question across everything ingested, with cited sources |
| **Financial Pulse** (`/finance`) | Cash, receivables, burn, runway + overdue invoices (read-only) |

## Quick start

1. **Database** — create a Postgres DB (Supabase/Neon free tier works), then:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   psql "$DATABASE_URL" -f db/seed.sql   # demo data so screens work immediately
   ```
2. **Env** — `cp .env.example .env`, fill in `DATABASE_URL` and `ANTHROPIC_API_KEY`.
3. **Run**:
   ```bash
   npm install
   npm run dev   # http://localhost:3000
   ```

Without `ANTHROPIC_API_KEY` the app still runs — it shows raw data instead of AI summaries.

## Ingestion

- **Manual (Phase 0 exit test):** `POST /api/ingest` with `{ "title": "...", "body": "..." }`
- **Connectors:** `npm run pull` runs every configured connector (cron it hourly).
  - `obsidian` — **works today**: set `OBSIDIAN_VAULT_PATH` to a synced copy of your vault
  - `outlook`, `zoho`, `coda` — scaffolded with wiring instructions in each file (Phase 1)

## Architecture (modular monolith)

```
src/lib/          db, claude (metered via credits), credits, memory, rag
src/modules/
  connectors/     one interface, four connectors, one upsert path
src/app/          Next.js App Router UI + API routes
db/               schema.sql (Postgres + pgvector-ready), seed.sql
scripts/pull.ts   scheduled ingestion job
```

Design rules baked in:
- **Read-only first** — no connector writes to a source system in Alpha.
- **Every AI call goes through the Credit System** — hard stop at zero credits.
- **Sync meaning, not megabytes** — normalized text + metadata + deep links back to the source.
- **pgvector column reserved** — semantic search is a data migration away, not a rewrite.

## Deploy

Vercel (app) + Supabase/Neon (Postgres). Set the same env vars in Vercel.
Schedule `npm run pull` via Vercel Cron or GitHub Actions.
