import { ATC, ATC1 } from "@/data/grist/atc";
import { Patho, SubstanceNom } from "@/db/pdbmMySQL/types";
import { AdvancedMedicamentGroup } from "./MedicamentTypes";

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

export type SearchResultData =
  | SearchSubstanceNom
  | AdvancedMedicamentGroup
  | SearchPatho
  | SearchATCClass;
