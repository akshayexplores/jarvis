import { query } from "./db";

/**
 * Credit System — governance layer for all AI usage.
 * Every Claude call must go through spend() first. Hard stop at zero.
 */

export async function balance(): Promise<number> {
  const rows = await query<{ total: string | null }>(
    "SELECT COALESCE(SUM(delta), 0)::text AS total FROM credit_ledger"
  );
  return Number(rows[0]?.total ?? 0);
}

/** Atomically spend credits; throws if the balance would go negative. */
export async function spend(cost: number, reason: string): Promise<void> {
  const rows = await query<{ ok: boolean }>(
    `INSERT INTO credit_ledger (delta, reason)
     SELECT $1, $2
     WHERE (SELECT COALESCE(SUM(delta),0) FROM credit_ledger) >= $3
     RETURNING true AS ok`,
    [-cost, reason, cost]
  );
  if (rows.length === 0) {
    throw new Error(`Out of credits (needed ${cost}). Top up via credit_ledger.`);
  }
}

export async function topUp(amount: number, reason = "manual top-up"): Promise<void> {
  await query("INSERT INTO credit_ledger (delta, reason) VALUES ($1, $2)", [amount, reason]);
}
