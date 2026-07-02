/**
 * Every integration implements this one interface.
 * pull() fetches new/changed items; the runner normalizes + upserts them.
 * Read-only by design in Alpha — connectors never write to source systems.
 */

export interface ContextObjectInput {
  source: string;
  externalId: string;
  kind: string; // 'note' | 'email' | 'event' | 'invoice' | 'doc' | ...
  title: string;
  body: string;
  url?: string;
  people?: string[];
  occurredAt?: Date;
}

export interface Connector {
  name: string;
  /** Returns true when required env vars are present. */
  configured(): boolean;
  pull(): Promise<ContextObjectInput[]>;
}
