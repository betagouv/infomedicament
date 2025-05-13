import { ATC, ATC1 } from "@/data/grist/atc";
import { Patho, Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";

export enum MainFilterTypeEnum {
  ALL = "Tout",
  MEDGROUP = "Médicament",
  SUBSTANCE = "Substance active",
  PATHOLOGY = "Pathologie",
  ATCCLASS = "Classe et sous-classe",
};
export type MainFilterCounterType = { [key in MainFilterTypeEnum]: number };

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
  | SubstanceNom
  | SearchMedicamentGroup
  | Patho
  | SearchATCClass;

export type ExtendedSearchResultItem = { 
  filterType: MainFilterTypeEnum;
  data: SearchResultData;
};

export type MainFilterType = {
  type: MainFilterTypeEnum;
  text: string;
};

//TODO faire un truc dynamique avec le ENUM
export const mainFiltersList: MainFilterType[] = [
  {
    type: MainFilterTypeEnum.ALL,
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