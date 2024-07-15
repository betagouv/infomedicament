import { Kysely, MysqlDialect, Selectable } from "kysely";
import { createPool } from "mysql2";

interface Database {
  Specialite: SpecialiteTable;
}

interface SpecialiteTable {
  SpecId: string;
  StatId: string;
  CommId: string;
  ProcId: string;
  SpecGeneId: string;
  SpecDenom01: string;
  SpecDenom02: string;
  SpecAbrev: string;
  SpecDateAMM: Date;
  SpecRem: string;
  SpecStatDate: Date;
  SpecDC01: string;
  SpecDC02: string;
  SpecFormPh: string;
  SpecVoie: string;
  StatutBdm: number;
  IsBdm: number;
  NumAuthEurope: string;
  Een: string;
}

export type Specialite = Selectable<SpecialiteTable>;

export const db = new Kysely<Database>({
  dialect: new MysqlDialect({
    pool: process.env.DATABASE_URL
      ? createPool(process.env.DATABASE_URL)
      : createPool({
          // .devcontainer config
          database: "pdbm_bdd",
          host: "db",
          user: "root",
          password: "mysql",
          port: 3306,
          connectionLimit: 10,
        }),
  }),
});
