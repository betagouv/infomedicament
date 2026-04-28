/**
 * Seeds the review app's PostgreSQL DB from a subset of staging data.
 * Only copies data relevant to the CIS codes listed in seed_cis_codes.txt.
 *
 * Required env vars:
 *   STAGING_DB_URL  – set once on parent app in Scalingo dashboard; review apps inherit it
 *   DATABASE_URL    – set automatically by Scalingo for each review app's PostgreSQL addon
 */

import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
// @ts-ignore – esbuild resolves this as a text module (loader: { ".txt": "text" })
import seedCisCodesRaw from "./seed_cis_codes.txt";

const STAGING_DB_URL = process.env.STAGING_DB_URL;
const REVIEW_DB_URL = process.env.DATABASE_URL;

if (!STAGING_DB_URL) throw new Error("STAGING_DB_URL is not set");
if (!REVIEW_DB_URL) throw new Error("DATABASE_URL is not set");

function createDb(connectionString: string) {
  return new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });
}

const cisCodes: string[] = (seedCisCodesRaw as string)
  .trim()
  .split("\n")
  .map((s: string) => s.trim())
  .filter(Boolean);

// CIS codes as numbers for bigint columns (notices.codeCIS, rcp.codeCIS)
const cisBigints = cisCodes.map(Number);

// Reference tables: copied in full (small, no CIS key)
const FULL_COPY_TABLES = [
  "atc",
  "classes_cliniques",
  "letters",
  'indications',
  "presentations",
  "ref_articles",
  "ref_atc_friendly_niveau_1",
  "ref_atc_friendly_niveau_2",
  "ref_glossaire",
  "ref_grossesse_substances_contre_indiquees",
  "ref_marr_url_pdf",
  "ref_pathologies",
  "ref_substance_active",
  "ref_substance_active_definitions",
  "resume_generiques",
  "resume_indications",
  "resume_substances",
  "vu_classes_cliniques"
];

// Tables with a bigint codeCIS column
const BIGINT_CIS_TABLES = ["notices", "rcp"];

// Tables with a text CIS column named "cis"
const CIS_TEXT_TABLES: Array<[string, string]> = [
  ["cis_atc", "code_cis"],
  ["ref_pediatrie", "cis"],
  ["ref_marr_url_cis", "cis"],
  ["ref_grossesse_mention", "cis"],
];

// Pairs of [parent table, content table] for recursive tree copies
const CONTENT_TREE_TABLE_PAIRS: Array<[string, string]> = [
  ["notices", "notices_content"],
  ["rcp", "rcp_content"],
];

async function insertRows(
  review: Kysely<any>,
  tablename: string,
  rows: any[]
) {
  if (rows.length === 0) {
    console.log(`  Skipping ${tablename} (no matching rows)`);
    return;
  }
  console.log(`  Copying ${tablename}: ${rows.length} rows...`);
  await sql`TRUNCATE TABLE ${sql.table(tablename)} CASCADE`.execute(review);
  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await review
      .insertInto(tablename)
      .values(rows.slice(i, i + CHUNK_SIZE))
      .execute();
  }
}

async function main() {
  const staging = createDb(STAGING_DB_URL!);
  const review = createDb(REVIEW_DB_URL!);

  console.log(`Seeding review app with ${cisCodes.length} CIS codes...`);

  // 1. Reference tables — copy in full
  console.log("\n--- Reference tables (full copy) ---");
  for (const tablename of FULL_COPY_TABLES) {
    const rows = await staging.selectFrom(tablename).selectAll().execute();
    await insertRows(review, tablename, rows);
  }

  // 2. Tables with bigint codeCIS column
  console.log("\n--- CIS-filtered tables (bigint codeCIS) ---");
  for (const tablename of BIGINT_CIS_TABLES) {
    const rows = await staging
      .selectFrom(tablename)
      .selectAll()
      .where("codeCIS", "in", cisBigints)
      .execute();
    await insertRows(review, tablename, rows);
  }

  // 3. Tables with text CIS column
  console.log("\n--- CIS-filtered tables (text cis column) ---");
  for (const [tablename, column] of CIS_TEXT_TABLES) {
    const rows = await staging
      .selectFrom(tablename)
      .selectAll()
      .where(column, "in", cisCodes)
      .execute();
    await insertRows(review, tablename, rows);
  }

  // 4. resume_medicaments — filter groups that contain at least one of our CIS codes
  console.log("\n--- resume_medicaments (CISList overlap) ---");
  {
    const { rows } = await sql<any>`
      SELECT * FROM resume_medicaments
      WHERE "CISList" && ${sql.val(cisCodes)}::text[]
    `.execute(staging);
    await insertRows(review, "resume_medicaments", rows);
  }

  // 5. Tree tables — collect all content nodes reachable from the filtered notices/rcps
  console.log("\n--- Tree tables (recursive content nodes) ---");
  for (const [parent, content] of CONTENT_TREE_TABLE_PAIRS) {
    const { rows } = await sql<any>`
      WITH RECURSIVE tree(id) AS (
        SELECT unnest(children) AS id
        FROM ${sql.table(parent)}
        WHERE "codeCIS" = ANY(${sql.val(cisBigints)}::bigint[])
        UNION
        SELECT unnest(c.children)
        FROM ${sql.table(content)} c
        INNER JOIN tree ON c.id = tree.id
        WHERE c.children IS NOT NULL
      )
      SELECT DISTINCT c.*
      FROM ${sql.table(content)} c
      WHERE c.id IN (SELECT id FROM tree WHERE id IS NOT NULL)
    `.execute(staging);
    await insertRows(review, content, rows);
  }

  // 6. Skipped tables
  console.log("\n--- Skipped ---");
  console.log("  search_index  (run npm run db:seed-search-index if needed)");
  console.log("  leaflet_images  (too large, not needed in review apps)");

  await staging.destroy();
  await review.destroy();

  console.log("\nDone seeding review app from staging.");
}

main();
