import type { Connector, ContextObjectInput } from "./types";

/**
 * Outlook connector — Microsoft Graph (mail + calendar), read-only.
 *
 * One-time setup:
 * 1. Register an app at entra.microsoft.com → App registrations.
 * 2. Delegated scopes: Mail.Read, Calendars.Read, offline_access.
 * 3. Complete the OAuth code flow once to obtain a refresh token → env.
 *    (Tenant can be "common" for personal/work accounts.)
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

async function getAccessToken(): Promise<string> {
  const tenant = process.env.MS_GRAPH_TENANT_ID || "common";
  const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.MS_GRAPH_CLIENT_ID!,
      client_secret: process.env.MS_GRAPH_CLIENT_SECRET!,
      refresh_token: process.env.MS_GRAPH_REFRESH_TOKEN!,
      grant_type: "refresh_token",
      scope: "https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Calendars.Read offline_access",
    }),
  });
  if (!res.ok) throw new Error(`MS Graph token refresh failed (${res.status}): ${(await res.text()).slice(0, 2