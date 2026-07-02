/**
 * Scheduled ingestion job — run via `npm run pull` (cron it hourly).
 * Freshness tiers per the roadmap: email/calendar near-real-time (webhooks later),
 * notes/docs hourly, financials daily.
 */
import "dotenv/config";
import { runAllConnectors } from "../src/modules/connectors";

async function main() {
  const counts = await runAllConnectors();
  for (const [name, n] of Object.entries(counts)) {
    console.log(n === -1 ? `[${name}] skipped (not configured)` : `[${name}] ingested ${n} items`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
