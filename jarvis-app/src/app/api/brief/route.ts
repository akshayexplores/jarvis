import { NextResponse } from "next/server";
import { recent, hitsToPrompt } from "@/lib/rag";
import { getFacts, factsToPrompt } from "@/lib/memory";
import { askClaude, aiEnabled } from "@/lib/claude";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

const SYSTEM = `You are Jarvis, a personal chief of staff for a solo founder.
Write a crisp morning brief in markdown with exactly these sections:
## Today — meetings/events with one line of context each
## Top 3 — the three things that matter most today
## Flags — anything overdue, risky, or financially notable (omit if none)
Be specific, use the provided context, never invent facts.`;

export async function GET() {
  try {
    const [items, facts, fin] = await Promise.all([
      recent(72, 25),
      getFacts(),
      query(
        "SELECT as_of::text, cash, receivables, monthly_burn, runway_months, overdue_invoices FROM financial_snapshots ORDER BY as_of DESC LIMIT 1"
      ),
    ]);

    if (!aiEnabled()) {
      return NextResponse.json({
        ai: false,
        brief: null,
        raw: { recent: items, facts, financials: fin[0] ?? null },
        note: "Set ANTHROPIC_API_KEY to enable AI-generated briefs.",
      });
    }

    const user = [
      factsToPrompt(facts),
      "Recent and upcoming context (last 72h + scheduled):",
      hitsToPrompt(items),
      fin[0] ? `Latest financial snapshot: ${JSON.stringify(fin[0])}` : "",
      `Today's date: ${new Date().toDateString()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const brief = await askClaude(SYSTEM, user, 2);
    return NextResponse.json({ ai: true, brief });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
