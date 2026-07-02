import { query } from "./db";

/**
 * Memory module — durable business facts injected into every AI prompt.
 * Small by design: dozens of facts, not thousands. Big corpora belong in the context store.
 */

export interface Fact {
  id: number;
  topic: string;
  fact: string;
}

export async function getFacts(): Promise<Fact[]> {
  return query<Fact & Record<string, unknown>>(
    "SELECT id, topic, fact FROM memory_facts ORDER BY created_at DESC LIMIT 100"
  ) as Promise<Fact[]>;
}

export async function addFact(topic: string, fact: string): Promise<void> {
  await query("INSERT INTO memory_facts (topic, fact) VALUES ($1, $2)", [topic, fact]);
}

export function factsToPrompt(facts: Fact[]): string {
  if (facts.length === 0) return "";
  return (
    "Known business facts (long-term memory):\n" +
    facts.map((f) => `- [${f.topic}] ${f.fact}`).join("\n")
  );
}
