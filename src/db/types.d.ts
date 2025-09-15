import { NoticeBlockType } from "@/types/MedicamentTypes";
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

export type LeafletImage = Selectable<LeafletImagesTable>;
export type SearchResult = Selectable<SearchIndexTable>;
export type PresentationDetail = Selectable<PresentationTable>;
export type FichesInfosDB = Selectable<FicheInfoTable>;
export type GroupeGeneriqueDB = Selectable<GroupeGeneriqueTable>;
export type DocBUDB = Selectable<DocBUTable>;
export type RCPContent = Selectable<RcpContentTable>;
export type Notice = Selectable<NoticeTable>;
export type Rating = Selectable<RatingTable>;
