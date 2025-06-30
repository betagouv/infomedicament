import { PresentationDetail } from "@/db/types";

export type NoticeBlockType = "generalites" | "usage" | "warnings" | "howTo" | "sideEffects" | "storage" | "composition";

export type Leaflet = {
    maj: string;
    generalities: Node[];
    usage: Node[];
    warnings: Node[];
    howTo: Node[];
    sideEffects: Node[];
    storage: Node[];
    composition: Node[];
} | undefined;

export type RcpContentBlock = {
  id?: number;
  type?: string;
  styles?: string[],
  anchor?: string,
  content?: string[];
  children?: RcpContentBlock[];
  tag?: string,
  rowspan?: number,
  colspan?: number,
}

export type Rcp = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  children?: RcpContentBlock[];
}

export type NoticeContentBlock = {
  id?: number;
  type?: string;
  styles?: string[],
  anchor?: string,
  content?: string[];
  children?: NoticeContentBlock[];
  tag?: string,
  rowspan?: number,
  colspan?: number,
}

export type Notice = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  children?: NoticeContentBlock[];
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