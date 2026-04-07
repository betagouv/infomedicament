import { NoticeBlockType } from "@/types/SpecialiteTypes";
import { Selectable } from "kysely";

export interface Database {
  search_index: SearchIndexTable;
  leaflet_images: LeafletImagesTable;
  presentations: PresentationTable;
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
  asmr: AsmrTable;
  smr: SmrTable;
  triam_gtiam: TriamGtiamTable;
  triam_classes: TriamClassesTable;
  triam_groupe_substance: TriamGroupeSubstanceTable;
  triam_subst_groupesubst: TriamSubstGroupesubstTable;
  triam_interactions: TriamInteractionsTable;
  interactions_search: InteractionsSearchTable;
}

interface SearchIndexTable {
  token: string;
  match_type: "name" | "substance" | "atc" | "pathology";
  group_name: string;
  match_label: string;
}

interface LeafletImagesTable {
  path: string;
  image: Buffer;
}

interface PresentationTable {
  codecip13: string;
  nom_presentation: string;
  numelement: number; //Display order for nomelement - first element to display
  nomelement: string;
  recipient: string;
  numrecipient: number; //Display order for recipient - second element to display
  nbrrecipient: number;
  qtecontenance: number;
  unitecontenance: string;
  caraccomplrecip: string;
  numordreedit: number; //Display order for caraccomplrecip - third element to display
  numdispositif: number;
  dispositif: string;
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
  specialites: string[][];//SpecId, SpecDenom01, StatutBdm, ProcId
  pathosCodes: string[];
  atc1Code?: string;
  atc2Code?: string;
  atc5Code?: string;
  CISList: string[];
  subsIds: string[];
  pathosCodesNames: string[][];//codePatho, NomPatho
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
  id: Generated<number>;
  code_terme: number | null;
  code_terme_pere: number | null;
  code: string | null;
  label_court: string | null;
  label_long: string | null;
  label_anglais: string | null;
  label_recherche: string | null;
  num_ordre_edit: number | null;
  date_creation: Date | null;
  date_modification: Date | null;
  date_inactivation: Date | null;
  source_ref: string | null;
  remarque: string | null;
}

export interface AsmrTable {
  code_evamed: string | null;
  motif_demande: string | null;
  code_cis: string | null;
  code_cip: string | null;
  denomination_specialite: string | null;
  date_avis_definitif: string | null;
  asmr: string | null;
  valeur_asmr: string | null;
  libelle_asmr: string | null;
}

export interface SmrTable {
  code_evamed: string | null;
  motif_demande: string | null;
  code_cis: string | null;
  code_cip: string | null;
  denomination: string | null;
  date_avis_definitif: string | null;
  smr: string | null;
  valeur_smr: string | null;
  libelle_smr: string | null;
}

export interface CisAtc {
  id: Generated<number>;
  code_cis: string | null;
  code_terme_atc: number | null;
  est_valide: boolean | null;
  est_certain: boolean | null;
  commentaire: string | null;
  date_creation: Date | null;
  date_modification: Date | null;
  code_modif: number | null;
}

interface TriamGtiamTable {
  num_groupe: number;
  groupe: string;
  date_groupe: Date;
}

interface TriamClassesTable {
  num_classe: number;
  nom: string;
  chapeau: string | null;
  rem_comment: string | null;
  dat_creation: Date | null;
  dat_modif: Date | null;
  dat_histo: Date | null;
}

interface TriamGroupeSubstanceTable {
  code_groupe_subst: string;
  code_groupe_pere: string | null;
  nom_groupe_subst: string;
  rem_groupe_subst: string | null;
  date_creation: Date | null;
  date_dern_modif: Date | null;
}

interface TriamInteractionsTable {
  num: number;
  code_groupe_subst1: string;
  code_groupe_subst2: string;
  classe: number | null;
  classe1: number | null;
  num_inter_clas: number | null;
  code: string | null;
  niveau: string | null;
  groupe: string | null;
  voie: number;
  historique: boolean;
  risque: string | null;
  conduite: string | null;
  commentaire: string | null;
  livret: number | null;
  dat_creation: Date;
  dat_modif: Date | null;
  dat_histo: Date | null;
}

interface TriamSubstGroupesubstTable {
  code_groupe_subst: string;
  subs_id: string;
}

interface InteractionsSearchTable {
  id: Generated<number>;
  label: string;
  type: "substance" | "medicament";
  subst_ids: string[];
}

export type LeafletImage = Selectable<LeafletImagesTable>;
export type SearchResult = Selectable<SearchIndexTable>;
export type PresentationDetail = Selectable<PresentationTable>;
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
export type TriamGtiam = Selectable<TriamGtiamTable>;
export type TriamClasses = Selectable<TriamClassesTable>;
export type TriamGroupeSubstance = Selectable<TriamGroupeSubstanceTable>;
export type TriamSubstGroupesubst = Selectable<TriamSubstGroupesubstTable>;
export type TriamInteraction = Selectable<TriamInteractionsTable>;
export type InteractionsSearchEntry = Selectable<InteractionsSearchTable>;
