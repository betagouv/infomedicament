import { Selectable } from "kysely";

export interface Database {
  search_index: SearchIndexTable;
  leaflet_images: LeafletImagesTable;
  presentations: PresentationTable;
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

export type LeafletImage = Selectable<LeafletImagesTable>;
export type SearchResult = Selectable<SearchIndexTable>;
export type PresentationDetail = Selectable<PresentationTable>;
