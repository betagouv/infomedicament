export type Substance = {
  SubsId: string;
  NomId: string;
  NomLib: string;
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
