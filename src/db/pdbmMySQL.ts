import "server-cli-only";

import { Kysely, MysqlDialect, Selectable } from "kysely";
import { createPool } from "mysql2";

interface PdbmMySQL {
  Specialite: SpecialiteTable;
  Element: SpecElementTable;
  Composant: SpecComposantTable;
  Subs_Nom: Subs_NomTable;
  Presentation: PresentationTable;
  CNAM_InfoTarif: InfoTarifTable;
  Spec_Delivrance: SpecDelivranceTable;
  DicoDelivrance: DicoDelivranceTable;
  StatutComm: StatutCommTable;
  StatutAdm: StatutAdmTable;
}

interface SpecialiteTable {
  SpecId: string;
  StatId: SpecialiteStat | null;
  CommId: SpecialiteComm | null;
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

export enum ComposantNatureId {
  Substance = "3",
  Fraction = "5",
}

interface SpecComposantTable {
  SpecId: string;
  ElmtNum: string;
  NatuId: ComposantNatureId;
  CompNum: number; // One component can be split into multiple rows with same CompNum
  SubsId: string;
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
  CommId: PresentationComm;
  StatId: PresentationStat | null;
  PresCommDate: Date | null;
  PresStatDate: Date | null;
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

interface StatutAdmTable {
  StatId: number;
  StatLibCourt: string;
  StatLibLong: string;
  StatDomaine: "P" | "S";
}

interface StatutCommTable {
  CommId: number;
  CommLibCourt: string;
  CommLibLong: string;
  CommDomaine: "P" | "S";
}

export type Specialite = Selectable<SpecialiteTable>;
export type SpecElement = Selectable<SpecElementTable>;
export type SpecComposant = Selectable<SpecComposantTable>;
export type SubstanceNom = Selectable<Subs_NomTable>;
export type Presentation = Selectable<PresentationTable>;
export type PresInfoTarif = Selectable<InfoTarifTable>;
export type SpecDelivrance = Selectable<SpecDelivranceTable> &
  Selectable<DicoDelivranceTable>;

// Those enums are store as small dictionary tables in the database
// but to benefit from TypeScript type checking
// we define them here as well and check that they match the database
// at runtime

// Should match StatutAdm table

export enum SpecialiteStat {
  "Valide" = 10,
  "Abrogée" = 20,
  "Suspendue" = 30,
  "Retirée" = 40,
  "Archivée" = 60,
}

export enum PresentationStat {
  Abrogation = 50,
}

// Should match StatutComm table

export enum SpecialiteComm {
  "Commercialisée" = 50,
}

export enum PresentationComm {
  "Commercialisation" = 10,
  "Arrêt" = 20,
  "Suspension" = 30,
  "Non communiquée" = 40,
  "Plus d'autorisation" = 45,
}

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
