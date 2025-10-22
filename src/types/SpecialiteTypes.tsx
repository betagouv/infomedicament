import { ResumeSpecialite } from "@/db/types";

export type ResumeSpecialiteATC = ResumeSpecialite & {
  atc1Label: string,
  atc2Label: string,
}