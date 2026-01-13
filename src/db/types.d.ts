import { NoticeBlockType } from "@/types/SpecialiteTypes";
import { Selectable } from "kysely";

export interface Database {
  search_index: SearchIndexTable;
  leaflet_images: LeafletImagesTable;
  presentations: PresentationTable;
  fiches_infos: FicheInfoTable;
  groupes_generiques: GroupeGeneriqueTable;
  documents_bon_usage: DocBUTable;
  composants: ComposantTable;
  elements: ElementTable;
  smr: SmrTable;
  asmr: AsmrTable;
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

interface ComposantTable {
  id?: number;
  dosage: string;
  nomComposant: string;
}

interface ElementTable {
  id?: number;
  nomElement: string;
  referenceDosage: string;
}

interface SmrTable {
  id?: number;
  date?: string;
  motif?: number;
  valeur?: string;
  libelle?: string;
}

interface AsmrTable {
  id?: number;
  date?: string;
  motif?: number;
  valeur?: string;
  libelle?: string;
}

interface FicheInfoTable {
  specId: string;
  listeInformationsImportantes?: string[];
  listeGroupesGeneriquesIds?: number[];
  listeComposants?: number[];
  listeTitulaires?: string[];
  listeDocumentsBonUsageIds?: number[],
  listeASMR?: number[];
  listeSMR?: number[];
  listeConditionsDelivrance?: string[];
  libelleCourtAutorisation?: string;
  libelleCourtProcedure?: string;
  presentations?: string[];
  listeElements?: number[];
}

interface GroupeGeneriqueTable {
  idGroupeGenerique: number;
  libelleGroupeGenerique: string;
}

interface DocBUTable {
  id?: number,
  urlBU: string,
  auteurBU: string,
  dateMajBU: string,
  typeDocBU: string,
  titreDocBU: string
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
  html?: string,
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
  html?: string,
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
export type DocBUDB = Selectable<DocBUTable>;
export type RCPContent = Selectable<RcpContentTable>;
export type Rating = Selectable<RatingTable>;
export type ResumePatho = Selectable<ResumePathosTable>;
export type ResumeSubstance = Selectable<ResumeSubstancesTable>;
export type ResumeSpecGroupDB = Selectable<ResumeMedicamentsTable>;
export type ResumeGeneric = Selectable<ResumeGenericsTable>;
export type Letters = Selectable<LettersTable>;
