import { NextResponse } from "next/server";
import { upsertContextObject, runAllConnectors } from "@/modules/connectors";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // connector pulls (Coda exports especially) need headroom

/** POST a manual note (Phase 0 exit test) — body: { title, body, kind? } */
export async function POST(req: Request) {
  try {
    const { title, body, kind } = (await req.json()) as {
      title?: string;
      body?: string;
      kind?: string;
    };
    if (!title || !body) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }
    await upsertContextObject({
      source: "manual",
      externalId: `manual-${Date.now()}`,
      kind: kind ?? "note",
      title,
      body,
      occurredAt: new Date(),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

/** GET triggers a connector pull (handy during development). */
export async function GET() {
  try {
    const counts = await runAllConnectors();
    return NextResponse.json({ counts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
