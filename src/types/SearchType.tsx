import { Patho, Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { ATC, ATC1 } from "./ATCTTypes";

export enum MainFilterTypeEnum {
  EMPTY = "EMPTY",
  MEDGROUP = "MEDGROUP",
  SUBSTANCE = "SUBSTANCE",
  PATHOLOGY = "PATHOLOGY",
  ATCCLASS = "ATCCLASS",
};

export type SearchATCClass = {
  class: ATC1; 
  subclasses: ATC[];
}

export type SearchMedicamentGroup = {
  groupName: string; 
  specialites: Specialite[];
  atc2: ATC;
  composants: any;
}

export type SearchResultItem =
  | SubstanceNom
  | { groupName: string; specialites: Specialite[] }
  | Patho
  | SearchATCClass;

export type ExtendedSearchResultItem = { 
  filterType: MainFilterTypeEnum;
  data : (
    | SubstanceNom
    | SearchMedicamentGroup
    | Patho
    | SearchATCClass
  )
};

export type MainFilterType = {
  type: MainFilterTypeEnum;
  text: string;
};

//TODO faire un truc dynamique avec le ENUM
export const mainFiltersList: MainFilterType[] = [
  {
    type: MainFilterTypeEnum.EMPTY,
    text: "Tout",
  },
  {
    type: MainFilterTypeEnum.MEDGROUP,
    text: "Médicament",
  },
  {
    type: MainFilterTypeEnum.SUBSTANCE,
    text: "Substance active",
  },
  {
    type: MainFilterTypeEnum.PATHOLOGY,
    text: "Pathologie",
  },
  {
    type: MainFilterTypeEnum.ATCCLASS,
    text: "Classe et sous-classe",
  }
];