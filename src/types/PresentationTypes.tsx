import { PresAgreColl, PresentationLight, PresInfoTarif } from "@/db/pdbmMySQL/types";
import { PresentationDetail } from "@/db/types";
import { Nullable } from "kysely";

export type Presentation = 
  PresentationLight 
  & Nullable<PresInfoTarif> 
  & Nullable<PresAgreColl> 
  & { 
    details?: PresentationDetail[],
  }

export type AgregateCaraccomplrecipsDetails = {
  caraccomplrecip: string;
  numordreedit: number;
}

export type AgregateRecipientDetails = {
  recipient: string;
  numrecipient: number;
  nbrrecipient: number;
  qtecontenance: number;
  unitecontenance: string;
  caraccomplrecips: AgregateCaraccomplrecipsDetails[],
}

export type AgregatePresentationDetails = {
  codecip13: string;
  numelement: number;
  nomelement: string;
  recipients: AgregateRecipientDetails[];
}
