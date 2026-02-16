import { Specialite } from "@/db/pdbmMySQL/types";
import { ResumeSpecGroupDB } from "@/db/types";
import { PediatricsInfo } from "./PediatricTypes";

export type SpecialiteAlerts = {
  pediatrics?: PediatricsInfo,
  pregnancyMentionAlert?: boolean;
  pregnancyPlanAlert?: boolean;
}

export type ResumeSpecialite = {
  SpecId: string,
  SpecDenom01: string,
  StatutBdm: string,
  ProcId: string,
  isSurveillanceRenforcee: boolean,
  alerts?: SpecialiteAlerts,
}

export type ResumeSpecGroup = ResumeSpecGroupDB & {
  resumeSpecialites: ResumeSpecialite[],
  atc1Label?: string,
  atc2Label?: string,
  alerts?: SpecialiteAlerts,
}

export type DetailedSpecialite = Specialite & {
  urlCentralise: string | null,
  statutAutorisation: string | null,
  statutComm: string | null,
  titulairesList?: string,
  generiqueName: string | null,
}

export type NoticeBlockType = "generalites" | "usage" | "warnings" | "howTo" | "sideEffects" | "storage" | "composition";

export type NoticeRCPContentBlock = {
  id?: number;
  type?: string;
  styles?: string[],
  anchor?: string,
  content?: string[];
  children?: NoticeRCPContentBlock[];
  tag?: string,
  rowspan?: number,
  colspan?: number,
}

export type RcpData = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  children?: NoticeRCPContentBlock[];
}

export type NoticeData = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  children?: NoticeRCPContentBlock[];
}
export type GroupeGenerique = {
  id: number;
  libelle: string;
}

export type SpecialiteWithSubstance = Specialite & {
  NomId: string;
}