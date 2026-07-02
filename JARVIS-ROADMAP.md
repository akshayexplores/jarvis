# Project Jarvis — Product Scope & Roadmap
**Prepared for:** GRAC Builder (Founder) · **Role:** CPO / Lead Architect view · **Date:** July 2026
**Build approach:** Solo founder + AI tools (Claude, Cursor, Lovable) · **Timeline:** ASAP — thin slices, shipping weekly

---

## 1. The Vision: A Workspace That Remembers

Every tool you use today has amnesia. Zoho knows your invoices but not that the late-paying client is the same person you're meeting Thursday. Obsidian holds your thinking but can't act on it. Outlook sees your commitments but doesn't know which ones matter.

The insight behind Jarvis is that **the product is not the dashboard — it's the context graph underneath it.** Dashboards that merely aggregate ("here are your emails, here are your numbers") have been built a hundred times and always fail, because glancing at five widgets is barely better than opening five tabs. What has *not* been built well is a system where every piece of data is connected to every other piece: this email → relates to this project → which has this budget → and this note from March explains why.

That's what your three existing modules already point at:

- **Memory** = long-term context (who matters, what's true about the business)
- **RAG-lite** = retrieval (pull the right context into any AI conversation)
- **Credit System** = governance (AI acts efficiently and within limits)

You've built the *brain stem*. What's missing is the **senses** (integrations feeding it data) and the **face** (one interface where you live). That framing drives everything below.

**How this actually changes how you work:** the unit of work shifts from "check my tools" to "ask my OS." Instead of reconstructing context every morning across four apps (~30–60 min of invisible tax), the OS reconstructs it for you and surfaces the three things that matter. The compounding effect is the real moat: every day of use makes the memory richer, which makes every answer better — a switching cost no competitor can copy.

---

## 2. Integration Strategy

The honest, executive-level answer: **do not try to deeply sync everything.** Sync the *meaning*, not the megabytes. Jarvis stores a lightweight, searchable copy (text + metadata + embeddings) of what each tool knows, and deep-links back to the source tool for the "system of record" view.

### The pattern: Hub-and-Spoke ingestion

```
Obsidian ─┐
Zoho     ─┤→ Connectors → Normalizer → Context Store (Postgres + vectors) → Jarvis UI + AI
Coda     ─┤                                        ↑
Outlook  ─┘                              Memory / RAG-lite / Credits
```

Every connector does the same three jobs: **pull** (fetch new/changed items), **normalize** (convert to a common "context object": title, body, source, people, dates, links), **index** (store + embed for retrieval). One pattern, four sources, and adding a fifth later is cheap.

### Per-tool reality check

| Tool | Difficulty | How |
|---|---|---|
| **Zoho Books** | Easy | Official REST API + OAuth. Pull invoices, expenses, P&L daily. Read-only forever — never write to accounting. |
| **Outlook** | Easy | Microsoft Graph API — mail, calendar, contacts in one API. Webhooks give near-real-time. |
| **Coda / Notion** | Easy | Both have solid APIs. Pull docs and tables on a schedule. |
| **Obsidian** | The tricky one | It's local files, no API. Solve it with a **sync bridge**: keep the vault in a synced location (Git, Obsidian Sync, or a small community sync plugin) and have Jarvis ingest the Markdown from there. Markdown is the easiest format in the world to parse — the difficulty is transport, not content. |

### Two rules that keep you sane

1. **Read-only first.** Alpha Jarvis observes everything, writes nothing. Writing back (sending email, updating records) comes later, gated by your Credit System. This eliminates the entire class of "the AI broke my books" risk.
2. **Freshness by tier.** Calendar/email: near-real-time. Notes/docs: hourly. Financials: daily. Nobody needs real-time P&L, and this cuts cost and complexity dramatically.

---

## 3. Alpha Feature Scope

Scoping principle for ASAP: **the Alpha is a mirror with a memory, not a robot.** Three features, ruthlessly.

### Mandatory (the Alpha)

**A. The Daily Brief (your "Today" screen)**
One screen, generated each morning: today's meetings *with context pulled from notes and email threads*, top 3 priorities, anything overdue, and one financial flag if warranted ("Invoice #142 is 15 days late"). This is the feature you'll open every day — it's the habit-former, and it's the first thing that proves the context graph works.

**B. Ask Jarvis (unified retrieval)**
A chat box over everything ingested: "What did I decide about GRAC pricing?" "What's my burn this quarter?" "Summarize everything about client X." This is your existing RAG-lite pointed at the full context store. It replaces search-across-four-apps, which is the single most painful daily behavior.

**C. Financial Pulse (read-only summary)**
Cash position, receivables/late invoices, monthly burn vs. last month, runway. Four numbers and a trend line from Zoho — not a BI tool. The value is that finance finally lives *next to* your day instead of in a separate portal you avoid.

### Explicitly deferred (and why)

- **Daily Heatmaps** — ship a simple activity strip inside the Daily Brief instead; a full heatmap is visualization polish, and polish never sells an Alpha to its only user (you).
- **Context-Aware Outreach** — this is a *Beta* flagship, not Alpha. It requires write-access, tone modeling, and trust you haven't earned from the system yet. Deferring it also gives the memory 4–8 weeks of data to make outreach actually context-aware rather than generically templated.
- **Automations/workflows, mobile app, team features** — all post-Beta.

The test for every Alpha decision: *does this make tomorrow's Daily Brief smarter?* If not, cut it.

---

## 4. Architecture (simple now, scalable later)

For a solo founder, the classic mistake is microservices on day one. The right call is a **modular monolith**: one deployable app, with internal modules that have clean boundaries so any of them can be split out when scale demands it.

- **Frontend:** Next.js/React web app (Lovable or Claude-assisted). One app, responsive.
- **Backend:** One API service (Node or Python). Modules: `connectors`, `context-store`, `memory`, `credits`, `brief-generator`, `ask`.
- **Data:** Postgres with `pgvector` — one database handles both structured data and embeddings. No separate vector DB until you have paying users.
- **Jobs:** A simple scheduled worker (cron-style) runs connector pulls and generates the morning brief. This async layer is what lets you scale later — heavy work never blocks the UI.
- **AI:** Claude API, with every call routed through your Credit System (this becomes your COGS meter *and* your pricing engine later).
- **Hosting:** Managed everything (Vercel + a managed Postgres like Supabase/Neon). You should spend zero hours on servers.

Why this scales: multi-tenancy later is "add `tenant_id` to every table + row-level security," not a rewrite. Connectors are already isolated, so a connector marketplace is additive. The credit system already meters per-user AI cost, which is exactly what a SaaS billing model needs.

---

## 5. The Roadmap

Weekly shipping cadence; each phase ends with something you use daily.

**Phase 0 — The Spine (Week 1–2)**
Stand up the app shell, Postgres + pgvector, auth (just you), and wire in your existing Memory / Credit / RAG-lite modules as backend services. Exit test: you can manually paste a note in and ask a question about it.

**Phase 1 — Senses (Week 2–4)**
Build connectors in order of ROI: Outlook (calendar+mail) → Zoho Books → Obsidian bridge → Coda. Read-only, scheduled pulls, everything normalized and embedded. Exit test: "Ask Jarvis" answers correctly from all four sources.

**Phase 2 — The Face (Week 4–6) → this is Alpha**
Ship the Daily Brief, Ask Jarvis UI, and Financial Pulse. Then **use it every single morning for 30 days** and keep a friction log — this log is your entire Beta backlog. Exit test: you stop opening Zoho and Outlook first thing in the morning.

**Phase 3 — Hands (Week 7–12) → Beta**
Graduated write-access, gated by Credits: draft (never send) follow-up emails from meeting context, propose calendar blocks, draft outreach using Memory (your Context-Aware Outreach lands here, done properly). Add the visualization layer: heatmaps, plan timelines. Exit test: Jarvis drafts something you send unedited.

**Phase 4 — Other People (Month 4–6) → Productization**
Multi-tenancy, onboarding flow, connector settings UI, security hardening, billing on top of the credit system. 5–10 design partners before any public launch.

---

## 6. Productization: From "My Tool" to "The Market"

**Dogfooding is the product strategy.** For the first 90 days, the only KPI is: *do you personally open Jarvis every morning?* If you — with maximum motivation — won't, no customer will.

**Sell the wedge, not the OS.** "Personal OS for everything" is unpitchable and un-onboardable. The market entry is one persona, one killer workflow: **"The Chief of Staff for solo founders — a daily brief that actually knows your business."** Land on the Daily Brief; expand into outreach, finance, and automation once they're hooked. (Compare: Superhuman = email speed → then more; Notion = docs → then everything.)

**Design partners before launch.** Recruit 5–10 founders who mirror your stack. Onboard them manually — concierge-style — and watch where they stall. Connector setup will be the #1 drop-off point; invest there before investing in any new feature.

**Pricing writes itself.** Your Credit System already meters AI usage per user. Price as base subscription (~$30–50/mo, solo-founder budget) + credit tiers for heavy AI use. Your COGS is visible per-user from day one — most AI startups discover theirs too late.

**Trust is the product for a market of one-person companies.** You're asking founders to connect email + notes + *accounting*. From Phase 4 onward: encryption at rest, per-tenant isolation, a plain-English data policy, and a one-click "disconnect and delete." SOC 2 only when a customer demands it — not before.

**Sequencing:** You (Alpha, month 1–2) → friendly founders (Beta, month 3–4) → paid design partners (month 5–6) → public launch only after ≥5 outsiders use the Daily Brief 5 days a week.

---

## The one-line summary

Build the **spine** (your existing modules + Postgres), give it **senses** (four read-only connectors), a **face** (Daily Brief + Ask Jarvis + Financial Pulse), then **hands** (drafting/outreach) — and productize by selling the Daily Brief wedge to founders like you, priced on the credit system you've already built.
