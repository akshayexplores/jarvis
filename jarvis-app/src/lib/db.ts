import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    pool = new Pool({ connectionString: url, max: 5 });
    // Jarvis lives in its own schema so it can share a database with other apps.
    // JARVIS_SCHEMA lets a demo instance point at e.g. "jarvis_demo" in the same DB.
    const schema = process.env.JARVIS_SCHEMA || "jarvis";
    if (!/^[a-z_][a-z0