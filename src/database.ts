import { Kysely, MysqlDialect, Selectable } from "kysely";
import { createPool } from "mysql2";

interface Database {
  Specialite: SpecialiteTable;
  Element: SpecElementTable;
  Composant: SpecComposantTable;
  Subs_Nom: Subs_NomTable;
  Presentation: PresentationTable;
  CNAM_InfoTarif: InfoTarifTable;
  Spec_Delivrance: SpecDelivranceTable;
  DicoDelivrance: DicoDelivranceTable;
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

interface SpecElementTable {
  SpecId: string;
  ElmtNum: string;
  ElmtNom: string;
  ElmtRem: string;
  ElmtRefDosage: string;
}

interface SpecComposantTable {
  SpecId: string;
  ElmtNum: string;
  NatuId: string;
  CompNum: number;
  SubstId: string;
  NomId: string;
  CompDosage: string;
  CompRem: string;
}

interface Subs_NomTable {
  SubsId: string;
  NomId: string;
  NomLib: string;
}

interface PresentationTable {
  SpecId: string;
  PresNum: string;
  PresNom01: string;
  codeCIP13: string;
}

interface InfoTarifTable {
  Cip13: string;
  Taux: string;
  Prix: string;
  DateEffet: Date;
  IndicRestreinte: string;
}

interface SpecDelivranceTable {
  SpecId: string;
  DelivId: string;
}

interface DicoDelivranceTable {
  DelivId: string;
  DelivCourt: string;
  DelivLong: string;
}

export type Specialite = Selectable<SpecialiteTable>;
export type SpecElement = Selectable<SpecElementTable>;
export type SpecComposant = Selectable<SpecComposantTable>;
export type SubstanceNom = Selectable<Subs_NomTable>;
export type PresInfoTarif = Selectable<InfoTarifTable>;
export type SpecDelivrance = Selectable<SpecDelivranceTable> &
  Selectable<DicoDelivranceTable>;

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
