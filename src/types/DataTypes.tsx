import { ATC, ATC1 } from "./ATCTypes";

export enum DataTypeEnum {
  MEDICAMENT = "Médicament",
  SUBSTANCE = "Substance active",
  ATCCLASS = "Classe et sous-classe",
  INDICATION = "Indication",
};

export type AdvancedATC1 = ATC1 & {nbSubstances: number};
export type AdvancedATC = ATC & {nbSubstances: number};

export type AdvancedATCClass = {
  class: AdvancedATC1;
  subclasses: AdvancedATC[];
};
