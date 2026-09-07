import { PresentationDetail } from "@/db/types";

export type KnownFact = "yes" | "no" | "unknown";

export type PresentationCommercializationStatus =
  | "commercialized"
  | "stopped"
  | "suspended"
  | "withdrawn"
  | "not-reported"
  | "unknown";

export type PresentationAuthorizationStatus =
  | "active"
  | "abrogated"
  | "unknown";

/**
 * Source-neutral presentation data exposed to the application.
 *
 * Commercial facts deliberately use explicit unknown values: the ANSM
 * datapackage does not currently contain CEPS price amounts/rates or every
 * CNAM flag, and missing data must not be interpreted as a negative answer.
 */
export type Presentation = {
  cis: string;
  cip13: string;
  cip7: string | null;
  name: string;
  commercializationStatus: PresentationCommercializationStatus;
  commercializationDate: Date | null;
  commercializationEndDate: Date | null;
  authorizationStatus: PresentationAuthorizationStatus;
  abrogationDate: Date | null;
  displayOrder: number | null;
  price: number | null;
  publicPriceExcludingDispensingFee: number | null;
  dispensingFee: number | null;
  reimbursementRate: string | null;
  reimbursementStatus: KnownFact;
  agreementStatus: KnownFact;
  retrocessionStatus: KnownFact;
  listeSusStatus: KnownFact;
  ivgStatus: KnownFact;
  details?: PresentationDetail[];
};

export type AggregateDispositifDetails = {
  numdispositif: number;
  dispositif: string;
};

export type AggregateCaraccomplrecipsDetails = {
  caraccomplrecip: string;
  numordreedit: number;
};

export type AggregateRecipientDetails = {
  recipient: string;
  numrecipient: number;
  nbrrecipient: number;
  qtecontenance: number;
  unitecontenance: string;
  caraccomplrecips: AggregateCaraccomplrecipsDetails[];
};

export type AggregatePresentationDetails = {
  codecip13: string;
  recipients: AggregateRecipientDetails[];
  dispositifs: AggregateDispositifDetails[];
};

export type PresentationRecipientsDetails = {
  contenance: string;
  recipient: string;
};
