import { ATC, ATC1 } from "@/data/grist/atc";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import { Specialite } from "@/db/pdbmMySQL/types";
import { PresentationDetail } from "@/db/types";

export type AdvancedSpecialite = Specialite & {
  pregnancyCISAlert?: boolean;
  pregnancySubsAlert?: boolean;
  pediatrics?: PediatricsInfo;
}

export type AdvancedMedicamentGroup = {
  groupName: string; 
  specialites: AdvancedSpecialite[];
  atc1?: ATC1;
  atc2?: ATC;
  composants: any;
  pregnancySubsAlert?: boolean;
  pregnancyCISAlert?: boolean;
  pediatrics?: PediatricsInfo;
};

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

export type Rcp = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  children?: NoticeRCPContentBlock[];
}

export type Notice = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  children?: NoticeRCPContentBlock[];
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
