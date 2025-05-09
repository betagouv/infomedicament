import "server-cli-only";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "@/db/types";

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      ...(process.env.APP_DB_URL
        ? {
            connectionString: process.env.APP_DB_URL,
          }
        : {
            // .devcontainer config
            database: "postgres",
            host: "localhost",
            user: "postgres",
            password: "postgres",
            port: 5432,
          }),
      max: 3,
      connectionTimeoutMillis: 5000,
    }),
  }),
});

export default db;
