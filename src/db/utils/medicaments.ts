"use server";

import { getAtc1, getAtc2, getAtcCode } from "@/data/grist/atc";
import { getAllPregnancyMentionAlerts, getPregnancyMentionAlert, getPregnancyPlanAlerts } from "@/data/grist/pregnancy";
import { MedicamentGroup } from "@/displayUtils";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { AllPediatricsInfo, getAllPediatrics, getPediatrics } from "@/data/grist/pediatrics";
import { PregnancyAlert } from "@/types/PregancyTypes";
import { SpecComposant, Specialite, SubstanceNom } from "../pdbmMySQL/types";
import { getComposants, getComposantsList } from "./composants";

export async function getAdvancedMedicamentGroupFromGroupNameSpecialites(
  groupName: string,
  specialites: Specialite[],
  pregnancyPlanAlerts?: PregnancyAlert[],
): Promise <AdvancedMedicamentGroup> {
  if(!pregnancyPlanAlerts) {
    pregnancyPlanAlerts = await getPregnancyPlanAlerts();
  }

  const atc = getAtcCode(specialites[0].SpecId);
  const composants = await getComposants(specialites[0].SpecId);
  const pregnancyPlanAlert = pregnancyPlanAlerts.find((s) =>
    composants.find((c) => Number(c.SubsId.trim()) === Number(s.id)),
  );
  const pediatricsInfo = {
    indication: false,
    contraindication: false,
    doctorAdvice: false,
    mention: false,
  }
  let pregnancyMentionAlert = false;

  const advancedSpecialites = await Promise.all(
    specialites.map(async (spec) => {
      const pediatrics = await getPediatrics(spec.SpecId);
      if(pediatrics){
        if(pediatrics.indication) pediatricsInfo.indication = true;
        if(pediatrics.contraindication) pediatricsInfo.contraindication = true;
        if(pediatrics.doctorAdvice) pediatricsInfo.doctorAdvice = true;
        if(pediatrics.mention) pediatricsInfo.mention = true;
      }
      const pregnancyAlert = await getPregnancyMentionAlert(spec.SpecId)
      if(pregnancyAlert) pregnancyMentionAlert = true;
      return {
        pregnancyMentionAlert: pregnancyAlert,
        pregnancyPlanAlert: !!pregnancyPlanAlert,
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
    pregnancyPlanAlert: !!pregnancyPlanAlert,
    pregnancyMentionAlert: pregnancyMentionAlert,
    pediatrics: (pediatricsInfo.indication || pediatricsInfo.contraindication || pediatricsInfo.doctorAdvice || pediatricsInfo.mention) ? pediatricsInfo : undefined,
  }
}

async function getAdvancedMedicament(
  medGroup: MedicamentGroup,
  composantsList: Array<SpecComposant & SubstanceNom>,
  pregnancyPlanAlerts: PregnancyAlert[],
  pregnancyMentionAlerts: string[],
  allPediatricsInfo: AllPediatricsInfo[],
): Promise<AdvancedMedicamentGroup> {
  const [groupName, specialites] = medGroup;
  const atc = getAtcCode(specialites[0].SpecId);

  const composants: Array<SpecComposant & SubstanceNom> = [];
  composantsList.forEach((comp) => {
    if(comp.SpecId === specialites[0].SpecId) composants.push(comp);
  })
  const pregnancyPlanAlert = pregnancyPlanAlerts.find((s) =>
    composants.find((c) => Number(c.SubsId.trim()) === Number(s.id)),
  );
  const pediatricsInfo = {
    indication: false,
    contraindication: false,
    doctorAdvice: false,
    mention: false,
  }
  let pregnancyMentionAlert = false;
  const advancedSpecialites = specialites.map((spec) => {
    const pediatrics = allPediatricsInfo.find((info) => info.CIS === spec.SpecId);
    if(pediatrics){
      if(pediatrics.indication) pediatricsInfo.indication = true;
      if(pediatrics.contraindication) pediatricsInfo.contraindication = true;
      if(pediatrics.doctorAdvice) pediatricsInfo.doctorAdvice = true;
      if(pediatrics.mention) pediatricsInfo.mention = true;
    }

    const pregnancyAlert = pregnancyMentionAlerts.find((mentionCIS) => mentionCIS === spec.SpecId);
    if(pregnancyAlert) pregnancyMentionAlert = true;
    return {
      pregnancyMentionAlert: !!pregnancyAlert,
      pregnancyPlanAlert: !!pregnancyPlanAlert,
      pediatrics: pediatrics,
      ...spec,
    }
  });

  return {
    groupName: groupName, 
    specialites: advancedSpecialites,
    atc1: atc ? await getAtc1(atc) : undefined,
    atc2: atc ? await getAtc2(atc) : undefined,
    composants: composants,
    pregnancyPlanAlert: !!pregnancyPlanAlert,
    pregnancyMentionAlert: pregnancyMentionAlert,
    pediatrics: (pediatricsInfo.indication || pediatricsInfo.contraindication || pediatricsInfo.doctorAdvice || pediatricsInfo.mention) ? pediatricsInfo : undefined,
  }
};

export async function getAdvancedMedicamentFromGroup(
  medGroupList: MedicamentGroup[]
): Promise <AdvancedMedicamentGroup[]>{
  const CISList: string[] = medGroupList.map((medGroup) => {
    const [groupName, specialites] = medGroup;
    return specialites[0].SpecId;
  });

  const pregnancyPlanAlerts: PregnancyAlert[] = await getPregnancyPlanAlerts();
  const pregnancyMentionAlerts: string[] = await getAllPregnancyMentionAlerts();
  const allPediatricsInfo: AllPediatricsInfo[] = await getAllPediatrics();
  const composantsList = await getComposantsList(CISList);

  return await Promise.all(
    medGroupList.map(async (medGroup) => {
      return getAdvancedMedicament(medGroup, composantsList, pregnancyPlanAlerts, pregnancyMentionAlerts, allPediatricsInfo);
    })
  );
};