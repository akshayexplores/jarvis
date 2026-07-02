import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await query(
      `SELECT as_of::text, cash, receivables, monthly_burn, runway_months, overdue_invoices
       FROM financial_snapshots ORDER BY as_of DESC LIMIT 30`
    );
    return NextResponse.json({ latest: rows[0] ?? null, history: rows });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
