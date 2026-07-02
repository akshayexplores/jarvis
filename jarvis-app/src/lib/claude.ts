import { spend } from "./credits";

/**
 * AI client — every call is metered through the Credit System.
 * Provider is chosen by env:
 *   - OPENROUTER_API_KEY set → OpenRouter (swap models freely via AI_MODEL,
 *     e.g. "anthropic/claude-sonnet-4.5", "openai/gpt-4o", "google/gemini-2.5-pro")
 *   - else ANTHROPIC_API_KEY → Anthropic direct
 */

export function aiEnabled(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY);
}

export async function askClaude(system: string, user: string, creditCost = 1): Promise<string> {
  if (!aiEnabled()) throw new Error("Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY");
  await spend(creditCost, `ai: ${user.slice(0, 60)}`);
  return process.env.OPENROUTER_API_KEY
    ? askOpenRouter(system, user)
    : askAnthropic(system, user);
}

async function askOpenRouter(system: string, user: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "X-Title": "Jarvis Personal OS",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "anthropic/claude-sonnet-4.5",
      max_tokens: 1500,
      