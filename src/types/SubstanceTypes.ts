export type Substance = {
  SubsId: string;
  NomId: string;
  NomLib: string;
  isCanonical: boolean;
};

export enum CompositionNature {
  Substance = "substance",
  Fraction = "fraction",
  Unknown = "unknown",
}

export type CompositionComponent = Substance & {
  SpecId: string;
  ElmtNum: number;
  ElmtOrdre: number;
  NatuId: CompositionNature;
  CompNum: number;
  CompOrdre: number;
  CompDosage: string;
  CompRem: string;
};

export type SubstancesName = {
  name: string,
  isCanonical: boolean,
  nbSpecsGroups: number,
  // Name of each substance; empty with a single substance
  details: { subsId: string, name: string }[],
};
