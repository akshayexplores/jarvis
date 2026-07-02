-- Jarvis Context Store — Phase 0 schema
-- Postgres 15+. pgvector is optional for Alpha (full-text search is used);
-- the vector column is here so embeddings can be added without a migration.
--
-- Everything lives in its own `jarvis` schema so Jarvis can safely share a
-- database with other apps (no table-name collisions with e.g. credit_ledger).

CREATE SCHEMA IF NOT EXISTS jarvis;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
SET search_path = jarvis, public, extensions;

-- Every piece of knowledge from every tool, normalized to one shape.
CREATE TABLE IF NOT EXISTS context_objects (
  id            BIGSERIAL PRIMARY KEY,
  source        TEXT NOT NULL,              -- 'obsidian' | 'outlook' | 'zoho' | 'coda' | 'manual'
  external_id   TEXT NOT NULL,              -- id in the source system (or file path)
  kind          TEXT NOT NULL,              -- 'note' | 'email' | 'event' | 'invoice' | 'doc' | ...
  title         TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  url           TEXT,                       -- deep link back to the system of record
  people        TEXT[] DEFAULT '{}',
  occurred_at   TIMESTAMPTZ,                -- when the thing happened (meeting time, invoice date)
  ingested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  search_tsv    TSVECTOR GENERATED ALWAYS AS (
                  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body,''))
                ) STORED,
  embedding     VECTOR(1024),               -- reserved for Phase 2+ semantic search
  UNIQUE (source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_context_search ON context_objects USING GIN (search_tsv);
CREATE INDEX IF NOT EXISTS idx_context_occurred ON context_objects (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_context_source_kind ON context_objects (source, kind);

-- Memory module: durable facts about the business ("client X pays late", "GRAC pricing is ...").
CREATE TABLE IF NOT EXISTS memory_facts (
  id          BIGSERIAL PRIMARY KEY,
  topic       TEXT NOT NULL,
  fact        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Credit system: every AI call spends credits; hard stop at zero.
CREATE TABLE IF NOT EXISTS credit_ledger (
  id          BIGSERIAL PRIMARY KEY,
  delta       INTEGER NOT NULL,             -- negative = spend, positive = top-up
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Financial Pulse: one row per day, written by the Zoho connector.
CREATE TABLE IF NOT EXISTS financial_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  as_of         DATE NOT NULL UNIQUE,
  cash          NUMERIC NOT NULL,
  receivables   NUMERIC NOT NULL,
  monthly_burn  NUMERIC NOT NULL,
  runway_months NUMERIC NOT NULL,
  overdue_invoices JSONB NOT NULL DEFAULT '[]'
);
