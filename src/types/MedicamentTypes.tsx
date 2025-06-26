import { ATC, ATC1 } from "@/data/grist/atc";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import { Specialite } from "@/db/pdbmMySQL/types";

export type AdvancedSpecialite = Specialite & {
  pregnancyAlert?: boolean;
  pediatrics?: PediatricsInfo;
}

export type AdvancedMedicamentGroup = {
  groupName: string; 
  specialites: AdvancedSpecialite[];
  atc1: ATC1;
  atc2: ATC;
  composants: any;
  pregnancyAlert?: boolean;
  pediatrics?: PediatricsInfo;
};