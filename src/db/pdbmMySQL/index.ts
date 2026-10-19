import "server-cli-only";

import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import type { PdbmMySQL } from "@/db/pdbmMySQL/types";

export const pdbmMySQL = new Kysely<PdbmMySQL>({
  dialect: new MysqlDialect({
    pool: process.env.PDBM_URL
      ? createPool(process.env.PDBM_URL)
      : createPool({
          // .devcontainer config
          database: "pdbm_bdd",
          host: "db-mysql",
          user: "root",
          password: "mysql",
          port: 3306,
          connectionLimit: 10,
        }),
  }),
});
