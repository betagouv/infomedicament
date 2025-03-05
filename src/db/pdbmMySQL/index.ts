import "server-cli-only";

import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import {
  PdbmMySQL,
  PresentationComm,
  PresentationStat,
  SpecialiteComm,
  SpecialiteStat,
} from "@/db/pdbmMySQL/types";

export const pdbmMySQL = new Kysely<PdbmMySQL>({
  dialect: new MysqlDialect({
    pool: process.env.PDBM_URL
      ? createPool(process.env.PDBM_URL)
      : createPool({
          // .devcontainer config
          database: "pdbm_bdd",
          host: "localhost",
          user: "root",
          password: "mysql",
          port: 3306,
          connectionLimit: 10,
        }),
  }),
});

(async () => {
  const StatutComm = await pdbmMySQL
    .selectFrom("StatutComm")
    .selectAll()
    .execute();

  const StatutAdm = await pdbmMySQL
    .selectFrom("StatutAdm")
    .selectAll()
    .execute();

  // Check that enums matches the database
  Object.values(StatutComm).forEach(({ CommId, CommLibCourt, CommDomaine }) => {
    if (
      (CommDomaine === "S" ? SpecialiteComm : PresentationComm)[CommId] !==
      CommLibCourt
    ) {
      throw new Error(
        `Enum does not match database: ${CommId} ${CommLibCourt} ${CommDomaine}`,
      );
    }
  });
  Object.values(StatutAdm).forEach(({ StatId, StatLibCourt, StatDomaine }) => {
    if (
      (StatDomaine === "S" ? SpecialiteStat : PresentationStat)[StatId] !==
      StatLibCourt
    ) {
      throw new Error(
        `Enum does not match database: ${StatId} ${StatLibCourt} ${StatDomaine}`,
      );
    }
  });
})();
