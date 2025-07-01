import { getAtc1, getAtc2, getAtcCode } from "@/data/grist/atc";
import { getSpecialite } from "./specialities";
import { getPregnancyAlerts } from "@/data/grist/pregnancy";
import { MedicamentGroup } from "@/displayUtils";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { getPediatrics } from "@/data/grist/pediatrics";
import { PregnancyAlert } from "@/types/PregancyTypes";
import { Specialite } from "../pdbmMySQL/types";

export async function getAdvancedMedicamentGroupFromGroupNameSpecialites(
  groupName: string,
  specialites: Specialite[],
  pregnancyAlerts?: PregnancyAlert[],
): Promise <AdvancedMedicamentGroup> {
  if(!pregnancyAlerts) {
    pregnancyAlerts = await getPregnancyAlerts();
  }

  const atc = getAtcCode(specialites[0].SpecId);
  const { composants } = await getSpecialite(specialites[0].SpecId);
  const pregnancyAlert = pregnancyAlerts.find((s) =>
    composants.find((c) => Number(c.SubsId.trim()) === Number(s.id)),
  );
  const pediatricsInfo = {
    indication: false,
    contraindication: false,
    doctorAdvice: false,
  }
  const advancedSpecialites = await Promise.all(
    specialites.map(async (spec) => {
      const pediatrics = await getPediatrics(spec.SpecId);
      if(pediatrics){
        if(pediatrics.indication) pediatricsInfo.indication = true;
        if(pediatrics.contraindication) pediatricsInfo.contraindication = true;
        if(pediatrics.doctorAdvice) pediatricsInfo.doctorAdvice = true;
      }
      return {
        pregnancyAlert: !!pregnancyAlert,
        pediatrics: pediatrics,
        ...spec,
      }
    })
  );

  return {
    groupName: groupName, 
    specialites: advancedSpecialites,
    atc1: atc ? await getAtc1(atc) : undefined,
    atc2: atc ? await getAtc2(atc) : undefined,
    composants: composants,
    pregnancyAlert: !!pregnancyAlert,
    pediatrics: (pediatricsInfo.indication || pediatricsInfo.contraindication || pediatricsInfo.doctorAdvice) ? pediatricsInfo : undefined,
  }
}

export async function getAdvancedMedicamentGroupFromMedicamentGroup(
  medGroup: MedicamentGroup,
  pregnancyAlerts?: PregnancyAlert[],
): Promise <AdvancedMedicamentGroup> {

  const [groupName, specialites] = medGroup;
  return getAdvancedMedicamentGroupFromGroupNameSpecialites(groupName, specialites, pregnancyAlerts);
}

export async function getAdvancedMedicamentGroupListFromMedicamentGroupList(
  medGroupList: MedicamentGroup[]
): Promise <AdvancedMedicamentGroup[]> {
  const pregnancyAlerts = await getPregnancyAlerts();

  return await Promise.all(
    medGroupList.map(async (medGroup) => {
      return getAdvancedMedicamentGroupFromMedicamentGroup(medGroup, pregnancyAlerts);
    })
  );
}