import type { Connector, ContextObjectInput } from "./types";

/**
 * Outlook connector — Microsoft Graph API (mail + calendar in one API).
 *
 * Wiring steps (Phase 1):
 * 1. Register an app at entra.microsoft.com → App registrations.
 * 2. Grant delegated scopes: Mail.Read, Calendars.Read, offline_access.
 * 3. Do the OAuth code flow once locally to obtain a refresh token; store it in env.
 * 4. Implement pull():
 *    - GET /me/calendarView?startDateTime=...&endDateTime=...  → kind 'event'
 *    - GET /me/messages?$top=50&$orderby=receivedDateTime desc → kind 'email'
 *    Map each to ContextObjectInput; use the Graph `id` as externalId and
 *    `webLink` as url so Jarvis deep-links back to Outlook.
 */

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
    // TODO(Phase 1): exchange refresh token → access token, then fetch
    // calendarView + messages as described above.
    console.warn("[outlook] connector configured but pull() not yet implemented");
    return [];
  },
};
