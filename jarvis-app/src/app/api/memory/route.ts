import { NextResponse } from "next/server";
import { getFacts, addFact } from "@/lib/memory";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ facts: await getFacts() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { topic, fact } = (await req.json()) as { topic?: string; fact?: string };
    if (!topic?.trim() || !fact?.trim()) {
      return NextResponse.json({ error: "topic and fact are required" }, { status: 400 });
    }
    await addFact(topic.trim(), fact.trim());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
