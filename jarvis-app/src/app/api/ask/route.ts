import { NextResponse } from "next/server";
import { search, hitsToPrompt } from "@/lib/rag";
import { getFacts, factsToPrompt } from "@/lib/memory";
import { askClaude, aiEnabled } from "@/lib/claude";

export const dynamic = "force-dynamic";

const SYSTEM = `You are Jarvis, answering questions about the founder's own business
using ONLY the retrieved context and memory facts provided. Cite sources inline
as [n] matching the numbered context items. If the context doesn't contain the
answer, say so plainly — never invent.`;

export async function POST(req: Request) {
  try {
    const { question } = (await req.json()) as { question?: string };
    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    const [hits, facts] = await Promise.all([search(question, 8), getFacts()]);

    if (!aiEnabled()) {
      return NextResponse.json({
        ai: false,
        answer: null,
        sources: hits,
        note: "Set ANTHROPIC_API_KEY to enable AI answers; showing raw search results.",
      });
    }

    const user = [
      factsToPrompt(facts),
      "Retrieved context:",
      hitsToPrompt(hits),
      `Question: ${question}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const answer = await askClaude(SYSTEM, user, 1);
    return NextResponse.json({ ai: true, answer, sources: hits });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
