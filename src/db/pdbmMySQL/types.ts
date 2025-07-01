import { Selectable } from "kysely";

export interface PdbmMySQL {
  Specialite: SpecialiteTable;
  Element: SpecElementTable;
  Composant: SpecComposantTable;
  Subs_Nom: Subs_NomTable;
  Presentation: PresentationTable;
  CEPS_Prix: CEPSPrixTable;
  Spec_Delivrance: SpecDelivranceTable;
  DicoDelivrance: DicoDelivranceTable;
  StatutComm: StatutCommTable;
  StatutAdm: StatutAdmTable;
  Patho: PathoTable;
  Spec_Patho: Spec_PathoTable;
  GroupeGene: GroupeGeneTable;
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
  PresCodeCip: string;
}

interface CEPSPrixTable {
  Cip13: string;
  TauxPriseEnCharge: string;
  PPF: number;
  Ppttc: number;
  HonoDisp: number;
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

interface PathoTable {
  codePatho: string;
  NomPatho: string;
  FlagSelection: boolean;
  Niveau: boolean;
  NumOrdre: number;
  InfoPatho: string;
}

interface Spec_PathoTable {
  SpecId: string;
  codePatho: string;
}

interface GroupeGeneTable {
  idGrp: number;
  LibLong: string;
  SpecId: string;
  codeStat: number;
  rangSpec: number;
}

export type Specialite = Selectable<SpecialiteTable>;
export type SpecElement = Selectable<SpecElementTable>;
export type SpecComposant = Selectable<SpecComposantTable>;
export type SubstanceNom = Selectable<Subs_NomTable>;
export type Presentation = Selectable<PresentationTable>;
export type PresInfoTarif = Selectable<CEPSPrixTable>;
export type SpecDelivrance = Selectable<SpecDelivranceTable> &
  Selectable<DicoDelivranceTable>;
export type Patho = Selectable<PathoTable>;
export type GroupeGene = Selectable<GroupeGeneTable>;

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
