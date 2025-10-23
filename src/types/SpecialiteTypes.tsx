import { ResumeSpecialiteDB } from "@/db/types";

export type ResumeSpecialite = ResumeSpecialiteDB & {
  atc1Label: string,
  atc2Label: string,
}