import { SpecComposant, SubstanceNom } from "@/db/pdbmMySQL/types";

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
}

export type ComposantComposition = SubstanceComposition & {
  composants?: SubstanceComposition[];
}

export type ElementComposition = {
  referenceDosage: string;
  composants: ComposantComposition[];
}

export type Smr = {
  DateAvis: Date;
  ValeurSmr: string;
  MotifEval: string;
  LibelleSmr: string;
  HASLiensPageCT: string | null;
}
export type Asmr = {
  DateAvis: Date;
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

export type ComposantSubsNom = SpecComposant & SubstanceNom;