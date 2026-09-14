import { PresentationDetail } from "@/db/types";

export type PresentationCommercialStatus =
  | "commercialised"
  | "stopped"
  | "suspended"
  | "withdrawn"
  | "unknown";

export type PresentationAdministrativeStatus = "active" | "abrogated" | "unknown";

export type PresentationCommercialData = {
  pricingKnown: boolean;
  retailPrice: number | null;
  priceExcludingDispensingFee: number | null;
  dispensingFee: number | null;
  reimbursementRate: string | null;
  communityApproval: boolean | null;
  communityApprovalDate: Date | null;
  additionalList: boolean | null;
  retrocessionList: boolean | null;
  ivgPricing: boolean | null;
};

export type Presentation = PresentationCommercialData & {
  cis: string;
  cip13: string;
  cip7: string | null;
  name: string | null;
  commercialStatus: PresentationCommercialStatus;
  commercialisationDate: Date | null;
  commercialisationEndDate: Date | null;
  administrativeStatus: PresentationAdministrativeStatus;
  administrativeStatusDate: Date | null;
  details?: PresentationDetail[];
};

export type AggregateDispositifDetails = {
  numdispositif: number;
  dispositif: string;
}

export type AggregateCaraccomplrecipsDetails = {
  caraccomplrecip: string;
  numordreedit: number;
}

export type AggregateRecipientDetails = {
  recipient: string;
  numrecipient: number;
  nbrrecipient: number;
  qtecontenance: number;
  unitecontenance: string;
  caraccomplrecips: AggregateCaraccomplrecipsDetails[];
}

export type AggregatePresentationDetails = {
  codecip13: string;
  recipients: AggregateRecipientDetails[];
  dispositifs: AggregateDispositifDetails[];
}

export type PresentationRecipientsDetails = {
  contenance: string;
  recipient: string;
}
