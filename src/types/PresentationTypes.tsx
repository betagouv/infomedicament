import { PresAgreColl, PresentationLight, PresentationRetro, PresInfoTarif } from "@/db/pdbmMySQL/types";
import { PresentationDetail } from "@/db/types";
import { Nullable } from "kysely";

export type Presentation = 
  PresentationLight 
  & Nullable<PresInfoTarif> 
  & Nullable<PresAgreColl> 
  & { 
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