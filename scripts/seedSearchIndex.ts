import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { seed } from "../src/db/seeds/1725439927263_searchIndex";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");

const db = new Kysely<any>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: DATABASE_URL }) }),
});

seed(db)
  .then(() => db.destroy())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
