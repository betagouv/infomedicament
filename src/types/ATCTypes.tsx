import type { ResumeSubstance } from "@/db/types";

export interface ATC1 extends ATC {
  children: ATC[];
}

export interface ATC {
  code: string;
  label: string;
  description: string;
  children?: ATC[];
}

export type ATCSubstances = {
  atc: ATC;
  substances: ResumeSubstance[];
}

export type ATCLabels = {
  atc1Label: string;
  atc2Label: string;
}
