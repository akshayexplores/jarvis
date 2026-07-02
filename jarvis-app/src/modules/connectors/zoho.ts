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
  if (!res.ok) throw new Error(`Zoho token refresh failed (${res.status}): ${(await res.t