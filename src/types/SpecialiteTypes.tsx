import { Specialite } from "@/db/pdbmMySQL/types";
import { PresentationDetail, ResumeSpecGroupDB } from "@/db/types";
import { PediatricsInfo } from "./PediatricTypes";

export type SpecialiteAlerts = {
  pediatrics?: PediatricsInfo,
  pregnancyMentionAlert?: boolean;
  pregnancyPlanAlert?: boolean;
}

export type ResumeSpecialite = {
    SpecId: string,
    SpecDenom01: string,
    isCommercialisee: boolean,
    isCentralisee: boolean,
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
  deliveranceList?: string[],
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

export type DocBonUsage = {
  Url?: string;
  DateMAJ: Date;
  TypeDoc?: string;
  TitreDoc?: string;
}

export type SubstanceComposition = {
  NomLib: string,
  dosage: string,
}

export type ComposantComposition = SubstanceComposition & {
  composants?: SubstanceComposition[];
}

export type ElementComposition = {
  referenceDosage: string;
  composants: ComposantComposition[];
}

export type Smr = {
  DateAvis: Date;
  ValeurSmr: string;
  MotifEval: string;
  LibelleSmr: string;
  HASLiensPageCT: string | null;
}
export type Asmr = {
  DateAvis: Date;
  ValeurAsmr: string;
  MotifEval: string;
  LibelleAsmr: string;
  HASLiensPageCT: string | null;
}

export type FicheInfos = {
  specId: string;
  listeInformationsImportantes?: string[];
  listeGroupesGeneriques?: GroupeGenerique[];
  listeDocumentsBonUsage?: DocBonUsage[],
  listeASMR?: Asmr[];
  listeSMR?: Smr[];
  presentations?: PresentationDetail[];
  listeElements: ElementComposition[];
}

export type SpecialiteWithSubstance = Specialite & {
  NomId: string;
}