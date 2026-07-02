import { query } from "../../lib/db";
import type { Connector, ContextObjectInput } from "./types";

/**
 * Zoho Books connector — read-only forever (never writes to accounting).
 * Pulls unpaid invoices as context objects AND writes today's row to
 * financial_snapshots (cash from bank accounts, burn from last-30-day expenses).
 *
 * One-time setup:
 * 1. api-console.zoho.com → Self Client → note client id/secret.
 * 2. Generate a grant code with scope: ZohoBooks.fullaccess.READ
 * 3. Exchange it once for a refresh token → env.
 * 4. Set ZOHO_DC to your data center TLD: com | in | eu | com.au | jp
 */

const DC = () => process.env.ZOHO_DC || "com";
const API = () => `https://www.zohoapis.${DC()}/books/v3`;

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
    client_id: process.env.ZOHO_CLIENT_ID!,
    client_secret: process.env.ZOHO_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });
  const res = await fetch(`https://accounts.zoho.${DC()}/oauth/v2/token?${params}`, { method: "POST" });
  if (!res.ok) throw new Error(`Zoho token refresh failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Zoho token refresh error: ${data.error}`);
  return data.access_token;
}

async function zohoGet<T>(token: string, path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${API()}${path}${sep}organization_id=${process.env.ZOHO_ORGANIZATION_ID}`, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  if (!res.ok) throw new Error(`Zoho ${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface ZohoInvoice {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  status: string;
  date: string;
  due_date: string;
  total: number;
  balance: number;
}

interface ZohoBankAccount {
  account_id: string;
  account_name: string;
  balance: number;
  is_active: boolean;
}

interface ZohoExpense {
  expense_id: string;
  date: string;
  total: number;
}

const isoDaysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);

export const zohoConnector: Connector = {
  name: "zoho",

  configured() {
    return Boolean(
      process.env.ZOHO_CLIENT_ID &&
        process.env.ZOHO_CLIENT_SECRET &&
        process.env.ZOHO_REFRESH_TOKEN &&
        process.env.ZOHO_ORGANIZATION_ID
    );
  },

  async pull(): Promise<ContextObjectInput[]> {
    const token = await getAccessToken();
    const items: ContextObjectInput[] = [];

    // 1) Unpaid invoices → context objects (so Ask Jarvis and the Brief see them).
    const inv = await zohoGet<{ invoices: ZohoInvoice[] }>(token, "/invoices?status=unpaid&per_page=100");
    const today = new Date().toISOString().slice(0, 10);
    const overdue: Array<{ number: string; client: string; amount: number; days_late: number }> = [];
    let receivables = 0;

    for (const i of inv.invoices ?? []) {
      receivables += i.balance;
      const daysLate = Math.floor((Date.parse(today) - Date.parse(i.due_date)) / 864e5);
      if (daysLate > 0) {
        overdue.push({ number: i.invoice_number, client: i.customer_name, amount: i.balance, days_late: daysLate });
      }
      items.push({
        source: "zoho",
        externalId: `invoice:${i.invoice_id}`,
        kind: "invoice",
        title: `Invoice ${i.invoice_number} — ${i.customer_name} (${i.status})`,
        body: `Amount due: ${i.balance} of ${i.total}. Issued ${i.date}, due ${i.due_date}.${daysLate > 0 ? ` OVERDUE by ${daysLate} days.` : ""}`,
        url: `https://books.zoho.${DC()}/app#/invoices/${i.invoice_id}`,
        people: [i.customer_name],
        occurredAt: new Date(i.due_date),
      });
    }

    // 2) Financial snapshot: cash, burn (last 30d expenses), runway.
    let cash = 0;
    try {
      const banks = await zohoGet<{ bankaccounts: ZohoBankAccount[] }>(token, "/bankaccounts");
      cash = (banks.bankaccounts ?? []).filter((b) => b.is_active).reduce((s, b) => s + b.balance, 0);
    } catch (err) {
      console.warn("[zoho] bank accounts unavailable:", (err as Error).message);
    }

    let burn = 0;
    try {
      const exp = await zohoGet<{ expenses: ZohoExpense[] }>(
        token,
        `/expenses?date_start=${isoDaysAgo(30)}&date_end=${today}&per_page=200`
      );
      burn = (exp.expenses ?? []).reduce((s, e) => s + e.total, 0);
    } catch (err) {
      console.warn("[zoho] expenses unavailable:", (err as Error).message);
    }

    const runway = burn > 0 ? cash / burn : 99;
    await query(
      `INSERT INTO financial_snapshots (as_of, cash, receivables, monthly_burn, runway_months, overdue_invoices)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5)
       ON CONFLICT (as_of) DO UPDATE SET
         cash = EXCLUDED.cash, receivables = EXCLUDED.receivables,
         monthly_burn = EXCLUDED.monthly_burn, runway_months = EXCLUDED.runway_months,
         overdue_invoices = EXCLUDED.overdue_invoices`,
      [cash, receivables, burn, Math.round(runway * 10) / 10, JSON.stringify(overdue)]
    );

    return items;
  },
};
