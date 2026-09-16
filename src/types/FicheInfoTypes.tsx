export type DocBonUsage = {
  url: string | null;
  updatedAt: Date;
  type: string | null;
  title: string | null;
}

export type ImportantInformation = {
  html: string;
  eventDate: Date;
  expiryDate: Date | null;
  typeCode: number;
  typeLabel: string;
}

export type SafetyEvent = {
  specialiteId: string;
  code: number;
  sequence: number;
  typeLabel: string | null;
  eventDate: Date | null;
  expiryDate: Date | null;
  comment: string | null;
  modifiedAt: Date | null;
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
  opinionDate: string | null;
  value: string;
  evaluationReason: string;
  opinionSummary: string;
  hasUrl: string | null;
}
export type Asmr = {
  opinionDate: string | null;
  value: string;
  evaluationReason: string;
  opinionSummary: string;
  hasUrl: string | null;
}

export type FicheInfos = {
  listeInformationsImportantes?: ImportantInformation[];
  listeDocumentsBonUsage?: DocBonUsage[],
  listeASMR?: Asmr[];
  listeSMR?: Smr[];
  listeElements: ElementComposition[];
  isSurveillanceRenforcee: boolean;
}
