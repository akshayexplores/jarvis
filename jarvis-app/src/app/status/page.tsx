"use client";

import { useEffect, useState } from "react";

interface StatusResponse {
  ai: boolean;
  credits: number;
  connectors: Array<{ name: string; configured: boolean }>;
  contextCounts: Array<{ source: string; n: string }>;
  latestFinancialSnapshot: string | null;
  error?: string;
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<string | null>(null);

  function load() {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setData)
      .catch((err) => setData({ error: (err as Error).message } as StatusResponse));
  }

  useEffect(load, []);

  async function pullNow() {
    setPulling(true);
    setPullResult(null);
    try {
      const res = await fetch("/api/ingest");
      const d = (await res.json()) as { counts?: Record<string, number>; error?: string };
      if (d.counts) {
        setPullResult(
          Object.entries(d.counts)
            .map(([k, v]) => (v === -1 ? `${k}: not configured` : `${k}: ${v} items`))
            .join(" · ")
        );
        load();
      } else {
        setPullResult(d.error ?? "Pull failed");
      }
    } finally {
      setPulling(false);
    }
  }

  return (
    <div>
      <h1>System Status</h1>

      {data?.error && <div className="card" style={{ borderColor: "var(--bad)" }}>{data.error}</div>}
      {!data && <p className="muted">Loading…</p>}

      {data && !data.error && (
        <>
          <div className="grid">
            <div className="card metric">
              <div className="label">AI</div>
              <div className="value" style={{ color: data.ai ? "var(--good)" : "var(--warn)" }}>
                {data.ai ? "On" : "Off"}
              </div>
            </div>
            <div className="card metric">
              <div className="label">Credits</div>
              <div className="value" style={{ color: data.credits > 0 ? "var(--good)" : "var(--bad)" }}>
                {data.credits}
              </div>
            </div>
            <div className="card metric">
              <div className="label">Financial data</div>
              <div className="value" style={{ fontSize: "1rem" }}>
                {data.latestFinancialSnapshot ?? "none"}
              </div>
            </div>
          </div>

          <h2>Connectors</h2>
          <div className="card">
            {data.connectors.map((c) => (
              <div key={c.name} style={{ marginBottom: "0.3rem" }}>
                <span style={{ color: c.configured ? "var(--good)" : "var(--muted)" }}>
                  {c.configured ? "●" : "○"}
                </span>{" "}
                {c.name} — {c.configured ? "configured" : "not configured (see .env.example)"}
              </div>
            ))}
            <div style={{ marginTop: "0.8rem" }}>
              <button onClick={pullNow} disabled={pulling}>
                {pulling ? "Pulling…" : "Pull all connectors now"}
              </button>
              {pullResult && <p className="muted">{pullResult}</p>}
            </div>
          </div>

          <h2>Context store</h2>
          <div className="card">
            {data.contextCounts.length === 0 && <span className="muted">Empty — capture a note or pull connectors.</span>}
            {data.contextCounts.map((c) => (
              <div key={c.source}>
                <span className="source-tag">{c.source}</span> {c.n} items
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
