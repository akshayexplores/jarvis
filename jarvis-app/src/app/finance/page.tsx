"use client";

import { useEffect, useState } from "react";

interface OverdueInvoice {
  number: string;
  client: string;
  amount: number;
  days_late: number;
}

interface Snapshot {
  as_of: string;
  cash: string;
  receivables: string;
  monthly_burn: string;
  runway_months: string;
  overdue_invoices: OverdueInvoice[];
}

interface FinanceResponse {
  latest: Snapshot | null;
  history?: Snapshot[];
  error?: string;
}

const fmt = (n: string | number) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function FinancePage() {
  const [data, setData] = useState<FinanceResponse | null>(null);

  useEffect(() => {
    fetch("/api/finance")
      .then((r) => r.json())
      .then(setData)
      .catch((err) => setData({ latest: null, error: (err as Error).message }));
  }, []);

  const s = data?.latest;

  return (
    <div>
      <h1>Financial Pulse</h1>
      <p className="muted">Four numbers, updated daily from Zoho Books. Read-only, always.</p>

      {data?.error && (
        <div className="card" style={{ borderColor: "var(--bad)" }}>{data.error}</div>
      )}

      {!data && <p className="muted">Loading…</p>}

      {s && (
        <>
          <div className="grid">
            <div className="card metric">
              <div className="label">Cash</div>
              <div className="value">{fmt(s.cash)}</div>
            </div>
            <div className="card metric">
              <div className="label">Receivables</div>
              <div className="value">{fmt(s.receivables)}</div>
            </div>
            <div className="card metric">
              <div className="label">Monthly burn</div>
              <div className="value">{fmt(s.monthly_burn)}</div>
            </div>
            <div className="card metric">
              <div className="label">Runway</div>
              <div className="value">{Number(s.runway_months).toFixed(1)} mo</div>
            </div>
          </div>

          {s.overdue_invoices.length > 0 && (
            <div className="card" style={{ borderColor: "var(--warn)" }}>
              <h2 style={{ marginTop: 0 }}>Overdue invoices</h2>
              {s.overdue_invoices.map((inv) => (
                <div key={inv.number}>
                  #{inv.number} — {inv.client} — {fmt(inv.amount)} —{" "}
                  <span style={{ color: "var(--warn)" }}>{inv.days_late} days late</span>
                </div>
              ))}
            </div>
          )}

          <p className="muted">As of {s.as_of}</p>
        </>
      )}

      {data && !data.latest && !data.error && (
        <p className="muted">No snapshots yet — run db/seed.sql or wire the Zoho connector.</p>
      )}
    </div>
  );
}
