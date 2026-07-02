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
  if (!res.ok) throw new Error(`MS Graph token refresh failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function graphGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Prefer: 'outlook.timezone="UTC"' },
  });
  if (!res.ok) throw new Error(`MS Graph ${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface GraphEvent {
  id: string;
  subject: string | null;
  bodyPreview: string | null;
  webLink: string | null;
  start: { dateTime: string };
  attendees?: Array<{ emailAddress: { name?: string; address?: string } }>;
}

interface GraphMessage {
  id: string;
  subject: string | null;
  bodyPreview: string | null;
  webLink: string | null;
  receivedDateTime: string;
  from?: { emailAddress: { name?: string; address?: string } };
}

export const outlookConnector: Connector = {
  name: "outlook",

  configured() {
    return Boolean(
      process.env.MS_GRAPH_CLIENT_ID &&
        process.env.MS_GRAPH_CLIENT_SECRET &&
        process.env.MS_GRAPH_REFRESH_TOKEN
    );
  },

  async pull(): Promise<ContextObjectInput[]> {
    const token = await getAccessToken();
    const items: ContextObjectInput[] = [];

    // Calendar: last 7 days through next 14 days (context for briefs).
    const start = new Date(Date.now() - 7 * 864e5).toISOString();
    const end = new Date(Date.now() + 14 * 864e5).toISOString();
    const cal = await graphGet<{ value: GraphEvent[] }>(
      token,
      `/me/calendarView?startDateTime=${start}&endDateTime=${end}&$top=50&$select=id,subject,bodyPreview,webLink,start,attendees`
    );
    for (const ev of cal.value) {
      items.push({
        source: "outlook",
        externalId: `event:${ev.id}`,
        kind: "event",
        title: ev.subject ?? "(no subject)",
        body: ev.bodyPreview ?? "",
        url: ev.webLink ?? undefined,
        people: (ev.attendees ?? [])
          .map((a) => a.emailAddress.name || a.emailAddress.address || "")
          .filter(Boolean),
        occurredAt: new Date(ev.start.dateTime.endsWith("Z") ? ev.start.dateTime : ev.start.dateTime + "Z"),
      });
    }

    // Mail: latest 50 messages.
    const mail = await graphGet<{ value: GraphMessage[] }>(
      token,
      `/me/messages?$top=50&$orderby=receivedDateTime desc&$select=id,subject,bodyPreview,webLink,receivedDateTime,from`
    );
    for (const m of mail.value) {
      const sender = m.from?.emailAddress.name || m.from?.emailAddress.address;
      items.push({
        source: "outlook",
        externalId: `mail:${m.id}`,
        kind: "email",
        title: m.subject ?? "(no subject)",
        body: `${sender ? `From: ${sender}\n` : ""}${m.bodyPreview ?? ""}`,
        url: m.webLink ?? undefined,
        people: sender ? [sender] : [],
        occurredAt: new Date(m.receivedDateTime),
      });
    }

    return items;
  },
};
