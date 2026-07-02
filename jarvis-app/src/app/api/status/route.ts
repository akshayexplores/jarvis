import { NextResponse } from "next/server";
import { connectors } from "@/modules/connectors";
import { balance } from "@/lib/credits";
import { aiEnabled } from "@/lib/claude";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [credits, counts, latestSnap] = await Promise.all([
      balance(),
      query<{ source: string; n: string }>(
        "SELECT source, COUNT(*)::text AS n FROM context_objects GROUP BY source ORDER BY source"
      ),
      query<{ as_of: string }>("SELECT as_of::text FROM financial_snapshots ORDER BY as_of DESC LIMIT 1"),
    ]);

    return NextResponse.json({
      ai: aiEnabled(),
      credits,
      connectors: connectors.map((c) => ({ name: c.name, configured: c.configured() })),
      contextCounts: counts,
      latestFinancialSnapshot: latestSnap[0]?.as_of ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
