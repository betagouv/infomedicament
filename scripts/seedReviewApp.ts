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
  "ansm_groupe_generique",
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
  ["ansm_specialite", "cis"],
  ["ansm_specialite_evenement", "cis"],
  ["ansm_specialite_groupe_generique", "cis"],
  ["ansm_specialite_titulaire", "cis"],
  ["cis_atc", "code_cis"],
  ["ref_pediatrie", "cis"],
  ["ref_marr_url_cis", "cis"],
  ["ref_grossesse_mention", "cis"],
  ["specialites_metadata", "CIS"],
  // resume_specialites is keyed per-specialité by specId (= the CIS code); the
  // search query reads result rows from it, so it must be seeded or search
  // returns empty. Filtered by specId to stay aligned with the seeded CIS subset.
  ["resume_specialites", "specId"],
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
  const totalBatches = Math.ceil(rows.length / CHUNK_SIZE);
  let progressLineWidth = 0;

  const updateProgress = (message: string, done = false) => {
    const line = `  Copying ${tablename}: ${message}`;
    progressLineWidth = Math.max(progressLineWidth, line.length);
    process.stdout.write(
      `\r${line.padEnd(progressLineWidth)}${done ? "\n" : ""}`,
    );
  };

  try {
    updateProgress(`${rows.length.toLocaleString()} rows - truncating...`);
    await sql`TRUNCATE TABLE ${sql.table(tablename)} CASCADE`.execute(review);

    if (rows.length === 0) {
      updateProgress("truncated - no matching rows", true);
      return;
    }

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const completedBatch = i / CHUNK_SIZE + 1;
      updateProgress(
        `truncated - inserting batch ${completedBatch}/${totalBatches} - ${i.toLocaleString()}/${rows.length.toLocaleString()} rows`,
      );

      await review
        .insertInto(tablename)
        .values(rows.slice(i, i + CHUNK_SIZE))
        .execute();

      const insertedRows = Math.min(i + CHUNK_SIZE, rows.length);
      updateProgress(
        `truncated - batch ${completedBatch}/${totalBatches} - ${insertedRows.toLocaleString()}/${rows.length.toLocaleString()} rows`,
      );
    }

    updateProgress(
      `done - ${totalBatches}/${totalBatches} batches - ${rows.length.toLocaleString()} rows`,
      true,
    );
  } catch (error) {
    updateProgress("failed", true);
    throw error;
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

  // 5. Skipped tables
  console.log("\n--- Skipped ---");
  console.log("  search_index  (run npm run db:seed-search-index if needed)");

  await staging.destroy();
  await review.destroy();

  console.log("\nDone seeding review app from staging.");
}

main();
