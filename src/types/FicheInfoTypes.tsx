export type DocBonUsage = {
  Url?: string;
  DateMAJ: Date;
  TypeDoc?: string;
  TitreDoc?: string;
}

export type InfosImportantes = {
  remCommentaire: string;
  dateEvnt: Date;
  codeTypeInfo: number;
}

export type SubstanceComposition = {
  NomLib: string,
  dosage: string,
  CompNum: number,
}

export type ComposantComposition = SubstanceComposition & {
  composants?: SubstanceComposition[];
}

export type ElementComposition = {
  referenceDosage: string;
  composants: ComposantComposition[];
}

export type Smr = {
  DateAvis: string | null;
  ValeurSmr: string;
  MotifEval: string;
  LibelleSmr: string;
  HASLiensPageCT: string | null;
}
export type Asmr = {
  DateAvis: string | null;
  ValeurAsmr: string;
  MotifEval: string;
  LibelleAsmr: string;
  HASLiensPageCT: string | null;
}

export type FicheInfos = {
  listeInformationsImportantes?: InfosImportantes[];
  listeDocumentsBonUsage?: DocBonUsage[],
  listeASMR?: Asmr[];
  listeSMR?: Smr[];
  listeElements: ElementComposition[];
  isSurveillanceRenforcee: boolean;
}

