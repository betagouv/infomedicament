/**
 * Copies all application tables from the staging PostgreSQL DB into the review
 * app's own DB. Run after migrations so the schema already exists.
 *
 * Required env vars:
 *   STAGING_DB_URL  – set once on parent app in Scalingo dashboard; review apps inherit it
 *   DATABASE_URL    – set automatically by Scalingo for each review app's PostgreSQL addon
 */

import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";

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

// Tables managed by Kysely migrations — skip them, migrations handle these
const SKIP_TABLES = new Set(["kysely_migration", "kysely_migration_lock"]);

async function main() {
  const staging = createDb(STAGING_DB_URL!);
  const review = createDb(REVIEW_DB_URL!);

  const { rows: stagingTables } = await sql<{ tablename: string }>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `.execute(staging);

  const { rows: reviewTables } = await sql<{ tablename: string }>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `.execute(review);

  const reviewTableSet = new Set(reviewTables.map((r) => r.tablename));

  for (const { tablename } of stagingTables) {
    if (SKIP_TABLES.has(tablename)) continue;

    if (!reviewTableSet.has(tablename)) {
      console.log(`Skipping ${tablename} (not in review app schema)`);
      continue;
    }

    const rows = await staging.selectFrom(tablename).selectAll().execute();

    if (rows.length === 0) {
      console.log(`Skipping ${tablename} (empty)`);
      continue;
    }

    console.log(`Copying ${tablename}: ${rows.length} rows...`);

    await sql`TRUNCATE TABLE ${sql.table(tablename)} CASCADE`.execute(review);

    // Kysely handles parameterization; batch to avoid hitting statement size limits
    const BATCH_SIZE = 200;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      await review.insertInto(tablename).values(rows.slice(i, i + BATCH_SIZE)).execute();
    }
  }

  await staging.destroy();
  await review.destroy();

  console.log("Done seeding review app from staging.");
}

main();
