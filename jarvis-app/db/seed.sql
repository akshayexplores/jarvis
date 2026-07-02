-- Demo data so the UI works before any connector is wired.
SET search_path = jarvis, public, extensions;

INSERT INTO credit_ledger (delta, reason) VALUES (500, 'initial top-up') ON CONFLICT DO NOTHING;

INSERT INTO memory_facts (topic, fact) VALUES
  ('GRAC', 'GRAC is a governance, risk & compliance SaaS; tagline: Continuous Compliance Assured.'),
  ('pricing', 'Decided in March: GRAC pricing anchored on per-framework tiers, not per-seat.'),
  ('clients', 'Acme Corp historically pays invoices 2-3 weeks late; follow up early.')
ON CONFLICT DO NOTHING;

INSERT INTO context_objects (source, external_id, kind, title, body, occurred_at) VALUES
  ('manual', 'demo-1', 'note', 'Q3 priorities', 'Ship GRAC audit module. Close two design partners. Keep burn under 20k/mo.', now() - interval '2 days'),
  ('manual', 'demo-2', 'event', 'Call with Acme Corp', 'Quarterly review call. Discuss renewal and the late invoice #142.', now() + interval '6 hours'),
  ('manual', 'demo-3', 'email', 'Re: Invoice #142', 'Acme AP team says payment is queued for this week. Third time they have said this.', now() - interval '1 day')
ON CONFLICT (source, external_id) DO NOTHING;

INSERT INTO financial_snapshots (as_of, cash, receivables, monthly_burn, runway_months, overdue_invoices) VALUES
  (CURRENT_DATE, 84500, 12300, 9800, 8.6, '[{"number":"142","client":"Acme Corp","amount":4200,"days