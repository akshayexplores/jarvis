import type { Connector, ContextObjectInput } from "./types";

/**
 * Zoho Books connector — REST API, read-only forever (never write to accounting).
 *
 * Wiring steps (Phase 1):
 * 1. Create a Self Client at api-console.zoho.com → note client id/secret.
 * 2. Generate a grant with scope ZohoBooks.fullaccess.READ, exchange for a refresh token.
 * 3. Implement pull():
 *    - GET /books/v3/invoices?status=overdue → kind 'invoice' (one context object each)
 *    - GET /books/v3/reports (P&L, cash)     → write a row to financial_snapshots
 *    Use invoice_id as externalId; compose url from the Zoho web app link.
 */

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
    // TODO(Phase 1): refresh token → access token; fetch overdue invoices and
    // daily financials; also INSERT INTO financial_snapshots.
    console.warn("[zoho] connector configured but pull() not yet implemented");
    return [];
  },
};
