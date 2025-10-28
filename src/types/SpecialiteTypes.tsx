import { Specialite } from "@/db/pdbmMySQL/types";
import { ResumeSpecialiteDB } from "@/db/types";

export type ResumeSpecialite = ResumeSpecialiteDB & {
  atc1Label: string,
  atc2Label: string,
}

export type DetailedSpecialite = Specialite & {
  UrlEpar: string | null,
}