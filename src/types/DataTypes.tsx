import { Patho, SubstanceNom } from "@/db/pdbmMySQL/types";
import { AdvancedMedicamentGroup } from "./MedicamentTypes";
import { ATC, ATC1 } from "@/data/grist/atc";

export enum DataTypeEnum {
  MEDGROUP = "Médicament",
  SUBSTANCE = "Substance active",
  ATCCLASS = "Classe et sous-classe",
  PATHOLOGY = "Pathologie",
};

export type AdvancedSubstanceNom = SubstanceNom & {
  nbSpecs: number;
};

export type AdvancedPatho = Patho & {
  nbSpecs: number;
};

export type AdvancedATC1 = ATC1 & {nbSubstances: number};

export type AdvancedATCClass = {
  class: AdvancedATC1;
  subclasses: ATC[];
};

export type AdvancedData = {
  result: (
    | AdvancedSubstanceNom
    | AdvancedMedicamentGroup
    | AdvancedPatho
    | AdvancedATCClass 
  ),
  type: DataTypeEnum,
};
