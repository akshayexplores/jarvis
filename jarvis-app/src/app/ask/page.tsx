"use client";

import { useState } from "react";

interface Source {
  id: number;
  source: string;
  kind: string;
  title: string;
  url: string | null;
}

interface AskResponse {
  ai: boolean;
  answer: string | null;
  sources?: Source[];
  note?: string;
  error?: string;
}

export default function AskPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AskResponse | null>(null);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      setData((await res.json()) as AskResponse);
    } catch (err) {
      setData({ ai: false, answer: null, error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Ask Jarvis</h1>
      <p className="muted">One question across notes, email, docs, and financials.</p>
      <form onSubmit={ask} style={{ display: "flex", gap: "0.6rem" }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='e.g. "What did I decide about GRAC pricing?"'
        />
        <button disabled={loading}>{loading ? "…" : "Ask"}</button>
      </form>

      {data?.error && (
        <div className="card" style={{ borderColor: "var(--bad)", marginTop: "1rem" }}>
          {data.error}
        </div>
      )}

      {data?.answer && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <pre className="brief">{data.answer}</pre>
        </div>
      )}

      {data && !data.ai && !data.error && data.note && (
        <p className="muted" style={{ marginTop: "1rem" }}>{data.note}</p>
      )}

      {data?.sources && data.sources.length > 0 && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Sources</h2>
          {data.sources.map((s, i) => (
            <div key={s.id} style={{ marginBottom: "0.4rem" }}>
              <span className="source-tag">{i + 1}</span>
              <span className="source-tag">{s.source}/{s.kind}</span>
              {s.url ? <a href={s.url}>{s.title}</a> : s.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
