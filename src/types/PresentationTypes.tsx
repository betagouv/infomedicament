import { PresentationRetro } from "@/db/pdbmMySQL/types";
import { BdpmPresentation, PresentationDetail } from "@/db/types";

export type Presentation = BdpmPresentation & {
  details?: PresentationDetail[],
  retro?: PresentationRetro,
}

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
  caraccomplrecips: AggregateCaraccomplrecipsDetails[],
}

export type AggregatePresentationDetails = {
  codecip13: string;
  recipients: AggregateRecipientDetails[];
  dispositifs: AggregateDispositifDetails[],
}

export type PresentationRecipientsDetails = {
  contenance: string;
  recipient: string;
}