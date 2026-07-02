import type { Connector, ContextObjectInput } from "./types";

/**
 * Coda connector — simple token API.
 *
 * Wiring steps (Phase 1):
 * 1. Create an API token at coda.io/account.
 * 2. Implement pull():
 *    - GET https://coda.io/apis/v1/docs                 → list docs
 *    - GET /docs/{docId}/pages + export page content    → kind 'doc'
 *    Use `${docId}/${pageId}` as externalId and browserLink as url.
 */

export const codaConnector: Connector = {
  name: "coda",

  configured() {
    return Boolean(process.env.CODA_API_TOKEN);
  },

  async pull(): Promise<ContextObjectInput[]> {
    // TODO(Phase 1): fetch docs/pages via the Coda API.
    console.warn("[coda] connector configured but pull() not yet implemented");
    return [];
  },
};
