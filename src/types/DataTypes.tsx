import { ATC, ATC1 } from "./ATCTypes";
import { ResumePatho, ResumeSubstance } from "@/db/types";
import { ResumeSpecGroup } from "./SpecialiteTypes";

export enum DataTypeEnum {
  MEDGROUP = "Médicament",
  SUBSTANCE = "Substance active",
  ATCCLASS = "Classe et sous-classe",
  PATHOLOGY = "Pathologie",
  EXPIRED = "Médicament non commercialisé",
};

export type AdvancedATC1 = ATC1 & {nbSubstances: number};
export type AdvancedATC = ATC & {nbSubstances: number};

export type AdvancedATCClass = {
  class: AdvancedATC1;
  subclasses: AdvancedATC[];
};

export type AdvancedData = {
  result: (
    | ResumeSubstance
    | ResumePatho
    | ResumeSpecGroup
    | AdvancedATCClass 
  ),
  type: DataTypeEnum,
};
