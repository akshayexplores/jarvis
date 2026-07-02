import { promises as fs } from "fs";
import path from "path";
import type { Connector, ContextObjectInput } from "./types";

/**
 * Obsidian bridge — fully functional.
 * Obsidian has no API; instead, point OBSIDIAN_VAULT_PATH at a synced copy of
 * your vault (Git checkout, Obsidian Sync folder, or any file-sync target)
 * and this connector ingests every Markdown file.
 */

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".")) continue; // skip .obsidian, .git, etc.
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.name.toLowerCase().endsWith(".md")) out.push(full);
  }
  return out;
}

export const obsidianConnector: Connector = {
  name: "obsidian",

  configured() {
    return Boolean(process.env.OBSIDIAN_VAULT_PATH);
  },

  async pull(): Promise<ContextObjectInput[]> {
    const vault = process.env.OBSIDIAN_VAULT_PATH!;
    const files = await walk(vault);
    const items: ContextObjectInput[] = [];

    for (const file of files) {
      const rel = path.relative(vault, file);
      const stat = await fs.stat(file);
      const body = await fs.readFile(file, "utf8");
      items.push({
        source: "obsidian",
        externalId: rel,
        kind: "note",
        title: path.basename(file, ".md"),
        body: body.slice(0, 50_000),
        url: `obsidian://open?file=${encodeURIComponent(rel)}`,
        occurredAt: stat.mtime,
      });
    }
    return items;
  },
};
