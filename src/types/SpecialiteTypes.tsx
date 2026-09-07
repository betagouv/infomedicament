import { Specialite } from "@/db/pdbmMySQL/types";
import { ResumeSpecGroupDB, ResumeSpecialiteDB } from "@/db/types";
import { PediatricsInfo } from "./PediatricTypes";
import { ShortIndication } from "./IndicationsTypes";

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
  urlCentralise: string | null,
  statutAutorisation: string | null,
  statutComm: string | null,
  titulairesList?: string,
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
