import { NoticeBlockType } from "@/types/SpecialiteTypes";
import { Selectable } from "kysely";

export interface Database {
  search_index: SearchIndexTable;
  leaflet_images: LeafletImagesTable;
  presentations: PresentationTable;
  fiches_infos: FicheInfoTable;
  groupes_generiques: GroupeGeneriqueTable;
  elements: ElementTable;
  rcp: RcpTable;
  rcp_content: RcpContentTable;
  notices: NoticeTable;
  notices_content: NoticeContentTable;
  rating: RatingTable;
  resume_pathologies: ResumePathosTable;
  resume_substances: ResumeSubstancesTable;
  resume_medicaments: ResumeMedicamentsTable;
  resume_generiques: ResumeGenericsTable;
  letters: LettersTable;
}

interface SearchIndexTable {
  token: string;
  table_name: "Specialite" | "Subs_Nom" | "Patho" | "ATC";
  id: string;
}

interface LeafletImagesTable {
  path: string;
  image: Buffer;
}

interface PresentationTable {
  codecip13: string;
  nomelement: string;
  nbrrecipient: number;
  recipient: string;
  caraccomplrecip: string;
  qtecontenance: number;
  unitecontenance: string;
}

interface ElementTable {
  id?: number;
  nomElement: string;
  referenceDosage: string;
}

interface FicheInfoTable {
  specId: string;
  listeInformationsImportantes?: string[]; //TODO A supprimer
  listeGroupesGeneriquesIds?: number[];
  listeComposants?: number[]; //TODO A supprimer
  listeTitulaires?: string[]; //TODO A supprimer
  listeDocumentsBonUsageIds?: number[], //TODO A supprimer
  listeASMR?: number[]; //TODO A supprimer
  listeSMR?: number[]; //TODO A supprimer
  listeConditionsDelivrance?: string[]; //TODO A supprimer
  libelleCourtAutorisation?: string; //TODO A supprimer
  libelleCourtProcedure?: string; //TODO A supprimer
  presentations?: string[];
  listeElements?: number[]; //TODO A supprimer
}

interface GroupeGeneriqueTable {
  idGroupeGenerique: number;
  libelleGroupeGenerique: string;
}

interface RcpTable {
  codeCIS: number,
  title?: string,
  dateNotif?: string,
  children?: number[],
}
interface RcpContentTable {
  id?: number,
  type?: string,
  styles?: string[],
  anchor?: string,
  content?: string[],
  children?: number[],
  tag?: string,
  rowspan?: number,
  colspan?: number,
}

interface NoticeTable {
  codeCIS: number,
  title?: string,
  dateNotif?: string,
  children?: number[],
}
interface NoticeContentTable {
  id?: number,
  type?: string,
  styles?: string[],
  anchor?: string,
  content?: string[],
  children?: number[],
  tag?: string,
  rowspan?: number,
  colspan?: number,
}

interface RatingTable {
  id?: number,
  pageId: string,
  rating?: number,
  question1?: number,
  question2?: number,
}

export type LetterType = "pathos" | "substances" | "specialites" | "generiques";
interface LettersTable{
  type: LetterType;
  letters: string[];
}

interface ResumePathosTable {
  codePatho: string;
  NomPatho: string;
  specialites: number;
}

interface ResumeSubstancesTable {
  SubsId: string;
  NomId: string;
  NomLib: string;
  specialites: number;
}

interface ResumeMedicamentsTable {
  groupName: string;
  composants: string;
  specialites: string[][];//SpecId, SpecDenom01, isCommercialisee, isCentralisee
  pathosCodes: string[];
  atc1Code?: string;
  atc2Code?: string;
  CISList: string[];
  subsIds: string[];
}

interface ResumeGenericsTable {
  SpecId: string;
  SpecName: string;
}

export type LeafletImage = Selectable<LeafletImagesTable>;
export type SearchResult = Selectable<SearchIndexTable>;
export type PresentationDetail = Selectable<PresentationTable>;
export type FichesInfosDB = Selectable<FicheInfoTable>;
export type GroupeGeneriqueDB = Selectable<GroupeGeneriqueTable>;
export type RCPContent = Selectable<RcpContentTable>;
export type Rating = Selectable<RatingTable>;
export type ResumePatho = Selectable<ResumePathosTable>;
export type ResumeSubstance = Selectable<ResumeSubstancesTable>;
export type ResumeSpecGroupDB = Selectable<ResumeMedicamentsTable>;
export type ResumeGeneric = Selectable<ResumeGenericsTable>;
export type Letters = Selectable<LettersTable>;
