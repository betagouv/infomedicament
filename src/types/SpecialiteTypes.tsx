import { ResumeSpecGroupDB, ResumeSpecialiteDB } from "@/db/types";
import { PediatricsInfo } from "./PediatricTypes";
import { ShortIndication } from "./IndicationsTypes";

// Application-facing medicine catalog model. The legacy property names are kept
// while MySQL consumers are migrated incrementally, but this is deliberately not
// a database row type: adapters only populate fields used by application code.
export type Specialite = {
  SpecId: string;
  SpecDenom01: string;
  SpecGeneId: string;
  ProcId: string;
  StatutBdm: number;
  Een: string | null;
};

export enum SpecialiteStat {
  "Valide" = 10,
  "Abrogée" = 20,
  "Suspendue" = 30,
  "Retirée" = 40,
  "Archivée" = 60,
}

export type SpecialiteAlerts = {
  pediatrics?: PediatricsInfo,
  pregnancyMentionAlert?: boolean;
  pregnancyPlanAlert?: boolean;
}

export type ShortSpecialite = {
  SpecId: string,
  SpecDenom01: string,
  StatutBdm: string,
  ProcId: string,
  isSurveillanceRenforcee: boolean,
  alerts?: SpecialiteAlerts,
}

export type ResumeSpecGroup = ResumeSpecGroupDB & {
  shortSpecialites: ShortSpecialite[],
  atc1Label?: string,
  atc2Label?: string,
  alerts?: SpecialiteAlerts,
  indicationsDetails?: ShortIndication[],
}

export type ResumeSpecialite = ResumeSpecialiteDB & {
  atc1Label?: string,
  atc2Label?: string,
  indicationsDetails?: ShortIndication[],
}

export type DetailedSpecialite = Specialite & {
  StatId: SpecialiteStat | null,
  SpecDateAMM: Date | null,
  SpecStatDate: Date | null,
  urlCentralise: string | null,
  statutAutorisation: string | null,
  statutComm: string | null,
  titulairesList: string | null,
  generiqueName: string | null,
}

export type NoticeBlockType = "generalites" | "usage" | "warnings" | "howTo" | "sideEffects" | "storage" | "composition";

export type RcpData = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  contentHtml: string;
}

export type NoticeData = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  contentHtml: string;
}
export type GroupeGenerique = {
  id: number;
  libelle: string;
}

export type SpecialiteWithSubstance = Specialite & {
  NomId: string;
}
