import "server-cli-only";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "@/db/types";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      ...(process.env.DATABASE_URL ?? process.env.APP_DB_URL
        ? {
            connectionString: process.env.DATABASE_URL ?? process.env.APP_DB_URL,
          }
        : {
            // .devcontainer config
            database: "postgres",
            host: "db-postgres",
            user: "postgres",
            password: "postgres",
            port: 5432,
          }),
      // Prerender workers each create a pool; keep their combined usage lower.
      max: process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD ? 3 : 10,
      connectionTimeoutMillis: 10000, // 10s to establish connection
      idleTimeoutMillis: 30000, // close idle connections after 30s
      keepAlive: true, // enable TCP keepalive
      keepAliveInitialDelayMillis: 10000, // start keepalive probes after 10s
    }),
  }),
});

export default db;
