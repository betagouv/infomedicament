import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { SpecialiteWithSubstance } from "./SpecialiteTypes";

export interface ATC1 extends ATC {
  children: ATC[];
}

export interface ATC {
  code: string;
  label: string;
  description: string;
  children?: ATC[];
}

export type ATCSubsSpecs = {
  atc: ATC;
  substances: SubstanceNom[];
  specialites: SpecialiteWithSubstance[];
}

export type ATCLabels = {
  atc1Label: string;
  atc2Label: string;
}