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
  UrlEpar: string | null,
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

export type Composant = {
  dosage: string;
  nom: string;
}

export type DocBonUsage = {
  url: string;
  auteur: string;
  dateMaj: string;
  typeDoc: string;
  titreDoc: string;
}

export type Smr = {
  date?: string;
  motif?: number;
  valeur?: string;
  libelle?: string;
}

export type Asmr = {
  date?: string;
  motif?: number;
  valeur?: string;
  libelle?: string;
}

export type ComposantElement = {
  nom: string;
  referenceDosage: string;
}

export type FicheInfos = {
  specId: string;
  listeInformationsImportantes?: string[];
  listeGroupesGeneriques?: GroupeGenerique[];
  listeComposants?: Composant[];
  listeTitulaires?: string[];
  listeDocumentsBonUsage?: DocBonUsage[],
  listeASMR?: Asmr[];
  listeSMR?: Smr[];
  listeConditionsDelivrance?: string[];
  libelleCourtAutorisation?: string;
  libelleCourtProcedure?: string;
  presentations?: PresentationDetail[];
  listeElements: ComposantElement[];
}

export type SpecialiteWithSubstance = Specialite & {
  NomId: string;
}