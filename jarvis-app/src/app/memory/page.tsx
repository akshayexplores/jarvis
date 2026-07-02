"use client";

import { useEffect, useState } from "react";

interface Fact {
  id: number;
  topic: string;
  fact: string;
}

export default function MemoryPage() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [topic, setTopic] = useState("");
  const [fact, setFact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/memory");
      const data = (await res.json()) as { facts?: Fact[]; error?: string };
      if (data.error) setError(data.error);
      else setFacts(data.facts ?? []);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || !fact.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, fact }),
      });
      setTopic("");
      setFact("");
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Memory</h1>
      <p className="muted">
        Durable business facts injected into every AI prompt. Keep it small and true —
        big corpora belong in connectors, not here.
      </p>

      <form onSubmit={add} className="card">
        <div style={{ display: "flex", gap: "0.6rem", marginBottom: "0.6rem" }}>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g. pricing, clients)"
            style={{ maxWidth: "240px" }}
          />
          <input
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            placeholder="The fact itself"
          />
        </div>
        <button disabled={saving}>{saving ? "Saving…" : "Remember this"}</button>
      </form>

      {error && <div className="card" style={{ borderColor: "var(--bad)" }}>{error}</div>}

      {facts.map((f) => (
        <div className="card" key={f.id}>
          <span className="source-tag">{f.topic}</span> {f.fact}
        </div>
      ))}
      {!error && facts.length === 0 && <p className="muted">No facts yet.</p>}
    </div>
  );
}
