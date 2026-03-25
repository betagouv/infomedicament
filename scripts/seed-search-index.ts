/**
 * Seeds the search_index table from the data already in PostgreSQL.
 * Can be run standalone in a Scalingo one-off container:
 *   node .next/standalone/scripts/seed-search-index.js
 *
 * Required env vars:
 *   DATABASE_URL – set automatically by Scalingo for each app's PostgreSQL addon
 */

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { seed } from "../src/db/seeds/1725439927263_searchIndex";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: DATABASE_URL }),
  }),
});

seed(db)
  .then(() => db.destroy())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
