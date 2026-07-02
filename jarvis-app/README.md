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
| **Capture** (`/capture`) | Drop a quick note straight into the context store |
| **Memory** (`/memory`) | View and add durable business facts (injected into every prompt) |
| **Status** (`/status`) | Connector health, credit balance, context counts, pull-now button |

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

- **Manual:** the Capture screen, or `POST /api/ingest` with `{ "title": "...", "body": "..." }`
- **Connectors:** `npm run pull` (cron it hourly) or the "Pull now" button on `/status`.
  All four are fully implemented — add credentials to `.env` and they go live:
  - `outlook` — Microsoft Graph: calendar (−7d…+14d) + latest 50 emails
  - `zoho` — unpaid invoices → context + daily financial snapshot (cash, burn, runway)
  - `coda` — docs and pages, exported as markdown
  - `obsidian` (optional) — set `OBSIDIAN_VAULT_PATH` to a synced copy of your vault

One-time credential setup for each connector is documented at the top of its file in
`src/modules/connectors/`.

## Auth

Set `APP_PASSWORD` + `SESSION_SECRET` and every route requires sign-in (login page,
signed httpOnly session cookie, 30-day expiry, logout in the nav). Unset = open,
for local development only. Single-user by design — multi-user auth is Phase 4.

## Architecture (modul