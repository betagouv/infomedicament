export interface ATC1 extends ATC {
  children: ATC[];
}

export interface ATC {
  code: string;
  label: string;
  description: string;
  children?: ATC[];
}

export type ATCSubs = {
  atc: ATC;
  nbSubstances: number;
}

export type ATCLabels = {
  atc1Label: string;
  atc2Label: string;
}
