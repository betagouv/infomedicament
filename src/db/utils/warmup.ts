import "server-cli-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";
import db from "@/db";

/**
 * CIS codes of the top ~500 medicaments to prerender at build time (warmup).
 * Curated list maintained in scripts/seed_cis_codes.txt.
 */
function readSeedCISCodes(): string[] {
  const file = readFileSync(
    join(process.cwd(), "scripts/seed_cis_codes.txt"),
    "utf8",
  );
  return file
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Returns the CIS codes to statically prerender for the warmup, or an empty
 * array when the Postgres DB has no data yet.
 *
 * Review apps build *before* their Postgres is seeded from staging, so the DB
 * is empty at build time. Prerendering the medicament pages then would bake
 * empty/fallback HTML (or break the build). We therefore only warm up when
 * `resume_medicaments` is non-empty (i.e. on populated staging/prod builds).
 */
export async function getWarmupCISCodes(): Promise<string[]> {
  const row = await db
    .selectFrom("resume_medicaments")
    .select(({ fn }) => fn.countAll<number>().as("count"))
    .executeTakeFirst();

  if (!row || Number(row.count) === 0) return [];

  return readSeedCISCodes();
}
