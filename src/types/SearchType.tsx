import { ATC, ATC1 } from "@/data/grist/atc";
import { Patho, Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";

export enum SearchTypeEnum {
  MEDGROUP = "Médicament",
  SUBSTANCE = "Substance active",
  ATCCLASS = "Classe et sous-classe",
  PATHOLOGY = "Pathologie",
};
export type ExtendedSearchResults = { [key in SearchTypeEnum]: SearchResultData[] };

export type SearchPatho = Patho & {
  nbSpecs: number;
};
export type SearchSubstanceNom = SubstanceNom & {
  nbSpecs: number;
};

export type SearchATCClass = {
  class: ATC1; 
  subclasses: ATC[];
};

export type SearchMedicamentGroup = {
  groupName: string; 
  specialites: Specialite[];
  atc1: ATC1;
  atc2: ATC;
  composants: any;
};

export type SearchResultData =
  | SearchSubstanceNom
  | SearchMedicamentGroup
  | SearchPatho
  | SearchATCClass;
