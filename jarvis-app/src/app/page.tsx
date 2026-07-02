"use client";

import { useState } from "react";

interface BriefResponse {
  ai: boolean;
  brief: string | null;
  raw?: unknown;
  note?: string;
  error?: string;
}

export default function DailyBriefPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BriefResponse | null>(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/brief");
      setData((await res.json()) as BriefResponse);
    } catch (err) {
      setData({ ai: false, brief: null, error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Daily Brief</h1>
      <p className="muted">
        One screen each morning: meetings with context, top priorities, and anything on fire.
      </p>
      <button onClick={generate} disabled={loading}>
        {loading ? "Thinking…" : "Generate today's brief"}
      </button>

      {data?.error && (
        <div className="card" style={{ borderColor: "var(--bad)" }}>
          {data.error}
        </div>
      )}

      {data?.brief && (
        <div className="card">
          <pre className="brief">{data.brief}</pre>
        </div>
      )}

      {data && !data.ai && !data.error && (
        <div className="card">
          <p className="muted">{data.note}</p>
          <pre className="brief">{JSON.stringify(data.raw, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
