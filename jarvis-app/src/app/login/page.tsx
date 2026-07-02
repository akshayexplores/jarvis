"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Login failed");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "12vh auto 0" }}>
      <h1 style={{ textAlign: "center" }}>◉ Jarvis</h1>
      <p className="muted" style={{ textAlign: "center" }}>A workspace that remembers.</p>
      <form onSubmit={login} className="card">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{ marginBottom: "0.6rem" }}
        />
        <button disabled={busy} style={{ width: "100%" }}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {error && (
          <p style={{ color: "var(--bad)", marginBottom: 0 }}>{error}</p>
        )}
      </form>
    </div>
  );
}
