import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
    pool = new Pool({ connectionString: url, max: 5 });
    // Jarvis lives in its own schema so it can share a database with other apps.
    pool.on("connect", (client) => {
      void client.query("SET search_path = jarvis, public, extensions");
    });
  }
  return pool;
}

export async function quer