"use client";

import { useState } from "react";

export default function CapturePage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (data.ok) {
        setStatus("Captured. Jarvis will remember it.");
        setTitle("");
        setBody("");
      } else {
        setStatus(data.error ?? "Something went wrong.");
      }
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Capture</h1>
      <p className="muted">Drop a quick note straight into the context store.</p>
      <form onSubmit={save} className="card">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{ marginBottom: "0.6rem" }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What happened / what you decided / what matters"
          rows={6}
          style={{ marginBottom: "0.6rem" }}
        />
        <button disabled={saving}>{saving ? "Saving…" : "Capture"}</button>
      </form>
      {status && <p className="muted">{status}</p>}
    </div>
  );
}
