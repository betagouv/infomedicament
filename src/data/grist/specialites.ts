import { ResumeSpecGroup, ResumeSpecialite } from "@/types/SpecialiteTypes";
import { getAllPregnancyMentionAlerts, getAllPregnancyPlanAlerts } from "./pregnancy";
import { getAllPediatrics } from "./pediatrics";

export const getResumeSpecsGroupsAlerts = async function (specsGroups: ResumeSpecGroup[]): Promise<ResumeSpecGroup[]> {
  const allPregnancyPlanAlerts = await getAllPregnancyPlanAlerts();
  const allPregnancyMentionAlerts = await getAllPregnancyMentionAlerts();
  const allPediatricsInfo = await getAllPediatrics();

  return specsGroups.map((group) => {
    const pregnancyPlanAlert = allPregnancyPlanAlerts.find((s) =>
      group.subsIds.find((id) => Number(id.trim()) === Number(s.id)),
    );

    const pediatricsInfo = {
      indication: false,
      contraindication: false,
      doctorAdvice: false,
      mention: false,
    }
    let pregnancyMentionAlert = false;
    const specialites: ResumeSpecialite[] = group.resumeSpecialites.map((spec: ResumeSpecialite) => {
      const pediatrics = allPediatricsInfo.find((info) => info.CIS === spec.SpecId);
      if(pediatrics){
        if(pediatrics.indication) pediatricsInfo.indication = true;
        if(pediatrics.contraindication) pediatricsInfo.contraindication = true;
        if(pediatrics.doctorAdvice) pediatricsInfo.doctorAdvice = true;
        if(pediatrics.mention) pediatricsInfo.mention = true;
      }
      const pregnancyAlert = allPregnancyMentionAlerts.find((mentionCIS) => mentionCIS === spec.SpecId);
      if(pregnancyAlert) pregnancyMentionAlert = true;
      return {
        ...spec,
        alerts: {
          pregnancyMentionAlert: !!pregnancyAlert,
          pregnancyPlanAlert: !!pregnancyPlanAlert,
          pediatrics: pediatrics,
        }
      }
    })

    return {
      ...group,
      alerts: {
        pregnancyPlanAlert: !!pregnancyPlanAlert,
        pregnancyMentionAlert: pregnancyMentionAlert,
        pediatrics: (pediatricsInfo.indication || pediatricsInfo.contraindication || pediatricsInfo.doctorAdvice || pediatricsInfo.mention) ? pediatricsInfo : undefined
      }, 
      resumeSpecialites: specialites,
    }
  })
}