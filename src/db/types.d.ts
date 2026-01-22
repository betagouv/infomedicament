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
  ref_articles: RefArticles;
  ref_atc_friendly_niveau_1: RefAtcFriendlyNiveau1;
  ref_atc_friendly_niveau_2: RefAtcFriendlyNiveau2;
  ref_glossaire: RefGlossaire;
  ref_grossesse_mention: RefGrossesseMention;
  ref_grossesse_substances_contre_indiquees: RefGrossesseSubstancesContreIndiquees;
  ref_marr_url_cis: RefMarrUrlCis;
  ref_marr_url_pdf: RefMarrUrlPdf;
  ref_pathologies: RefPathologies;
  ref_pediatrie: RefPediatrie;
  ref_substance_active: RefSubstanceActive;
  ref_substance_active_definitions: RefSubstanceActiveDefinitions;
  atc: Atc;
  cis_atc: CisAtc;
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
interface LettersTable {
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

export interface RefArticles {
  contenu: string | null;
  homepage: boolean | null;
  id: Generated<number>;
  image: string | null;
  lien: string | null;
  metadescription: string | null;
  source: string | null;
  theme: string | null;
  titre: string | null;
  atc_classe: string | null;
  substances: string | null;
  specialites: string | null;
  pathologies: string | null;
}

export interface RefAtcFriendlyNiveau1 {
  code: string | null;
  definition_classe: string | null;
  id: Generated<number>;
  libelle: string | null;
}

export interface RefAtcFriendlyNiveau2 {
  code: string | null;
  definition_sous_classe: string | null;
  id: Generated<number>;
  libelle: string | null;
}

export interface RefGlossaire {
  definition: string | null;
  id: Generated<number>;
  nom: string | null;
  source: string | null;
  a_souligner: boolean | null;
}

export interface RefGrossesseMention {
  cis: string | null;
  id: Generated<number>;
}

export interface RefGrossesseSubstancesContreIndiquees {
  id: Generated<number>;
  lien_site_ansm: string | null;
  subs_id: string | null;
}

export interface RefMarrUrlCis {
  cis: string | null;
  id: Generated<number>;
  url: string | null;
}

export interface RefMarrUrlPdf {
  id: Generated<number>;
  nom_document: string | null;
  type: string | null;
  url: string | null;
  url_document: string | null;
}

export interface RefPathologies {
  code_patho: string | null;
  definition: string | null;
  id: Generated<number>;
}

export interface RefPediatrie {
  avis: string | null;
  cis: string | null;
  contre_indication: string | null;
  id: Generated<number>;
  indication: string | null;
  mention: string | null;
}

export interface RefSubstanceActive {
  definition: string | null;
  id: Generated<number>;
  nom_id: string | null;
  sa: string | null;
  subs_id: string | null;
}

export interface RefSubstanceActiveDefinitions {
  definition: string | null;
  id: Generated<number>;
  nom_id: string | null;
  sa: string | null;
  subs_id: string | null;
}

export interface Atc {
  code: string | null;
  id: Generated<number>;
  label: string | null;
}

export interface CisAtc {
  code_atc: string | null;
  code_cis: string | null;
  id: Generated<number>;
  label_atc: string | null;
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
export type ATC = Selectable<Atc>;
export type CIS_ATC = Selectable<CisAtc>;
export type RefArticles = Selectable<RefArticles>;
export type RefAtcFriendlyNiveau1 = Selectable<RefAtcFriendlyNiveau1>;
export type RefAtcFriendlyNiveau2 = Selectable<RefAtcFriendlyNiveau2>;
export type RefGlossaire = Selectable<RefGlossaire>;
export type RefGrossesseMention = Selectable<RefGrossesseMention>;
export type RefGrossesseSubstancesContreIndiquees = Selectable<RefGrossesseSubstancesContreIndiquees>;
export type RefMarrUrlCis = Selectable<RefMarrUrlCis>;
export type RefMarrUrlPdf = Selectable<RefMarrUrlPdf>;
export type RefPathologies = Selectable<RefPathologies>;
export type RefPediatrie = Selectable<RefPediatrie>;
export type RefSubstanceActive = Selectable<RefSubstanceActive>;
export type RefSubstanceActiveDefinitions = Selectable<RefSubstanceActiveDefinitions>;
