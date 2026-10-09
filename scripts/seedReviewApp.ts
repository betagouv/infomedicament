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

// Reference catalogs and interaction data: copied in full (no CIS key).
const FULL_COPY_TABLES = [
  "atc",
  "ansm_atc",
  "ansm_classe_clinique",
  "ansm_classe_clinique_pathologie",
  "ansm_classe_interaction",
  "ansm_classe_groupe_substance",
  "ansm_delivrance",
  "ansm_excipient_effet_notoire",
  "ansm_groupe_generique",
  "ansm_groupe_substance",
  "ansm_interaction",
  "ansm_pathologie",
  "ansm_substance_groupe_substance",
  "ansm_substance_nom",
  "ansm_videos",
  "classes_cliniques",
  "has_url_has",
  "letters",
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
  "search_synonyms",
  "vu_classes_cliniques",
];

// Tables with a bigint codeCIS column
const BIGINT_CIS_TABLES = ["notices", "rcp"];

// Tables keyed directly by a text CIS code (column names vary by source).
const CIS_TEXT_TABLES: Array<[string, string]> = [
  ["ansm_specialite", "cis"],
  ["ansm_presentation", "cis"],
  ["ansm_element", "cis"],
  ["ansm_composant", "cis"],
  ["ansm_document", "cis"],
  ["ansm_specialite_atc", "cis"],
  ["ansm_specialite_classe_clinique", "cis"],
  ["ansm_specialite_delivrance", "cis"],
  ["ansm_specialite_evenement", "cis"],
  ["ansm_specialite_excipient_effet_notoire", "cis"],
  ["ansm_specialite_groupe_generique", "cis"],
  ["ansm_specialite_titulaire", "cis"],
  ["ansm_videos_cis", "CIS"],
  ["ansm_stock", "CIS"],
  ["cis_atc", "code_cis"],
  ["has_asmr", "code_cis"],
  ["has_smr", "code_cis"],
  ["has_documents_bon_usage", "code_cis"],
  ["ref_pediatrie", "cis"],
  ["ref_marr_url_cis", "cis"],
  ["ref_grossesse_mention", "cis"],
  ["specialites_metadata", "CIS"],
  // resume_specialites is keyed per-specialité by specId (= the CIS code); the
  // search query reads result rows from it, so it must be seeded or search
  // returns empty. Filtered by specId to stay aligned with the seeded CIS subset.
  ["resume_specialites", "specId"],
];

// Packaging and presentation events have a CIP key, rather than a CIS key.
const CIP_TABLES = [
  "ansm_recipient",
  "ansm_dispositif",
  "ansm_caracteristique",
  "ansm_presentation_evenement",
];

async function insertRows(review: Kysely<any>, tablename: string, rows: any[]) {
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

  try {
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

    // 4. CIP-filtered tables — retain packaging for the selected specialites only.
    console.log("\n--- CIP-filtered tables (selected ANSM presentations) ---");
    for (const tablename of CIP_TABLES) {
      const rows = await staging
        .selectFrom(tablename)
        .selectAll()
        .where(
          "cip",
          "in",
          staging
            .selectFrom("ansm_presentation")
            .select("cip")
            .where("cis", "in", cisCodes),
        )
        .execute();
      await insertRows(review, tablename, rows);
    }

    // 5. resume_medicaments — filter groups that contain at least one of our CIS codes
    console.log("\n--- resume_medicaments (CISList overlap) ---");
    {
      const { rows } = await sql<any>`
      SELECT * FROM resume_medicaments
      WHERE "CISList" && ${sql.val(cisCodes)}::text[]
    `.execute(staging);
      await insertRows(review, "resume_medicaments", rows);
    }

    // 6. Skipped tables
    console.log("\n--- Skipped ---");
    console.log("  search_index  (run npm run db:seed-search-index if needed)");
    console.log(
      "  triam_* / interactions_search / indications  (omitted from previews)",
    );
    console.log(
      "  rating / pipeline_run  (user feedback and operational history)",
    );
  } finally {
    await Promise.all([staging.destroy(), review.destroy()]);
  }

  console.log("\nDone seeding review app from staging.");
}

main().catch((error) => {
  console.error("Failed to seed review app:", error);
  process.exitCode = 1;
});
