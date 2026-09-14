import { ResumeSpecGroup, ShortSpecialite } from "@/types/SpecialiteTypes";
import { getAllPregnancyMentionAlerts, getAllPregnancyPlanAlerts } from "@/db/utils/pregnancy";
import { getAllPediatrics } from "@/db/utils/pediatrics";

export const getResumeSpecsGroupsAlerts = async function (specsGroups: ResumeSpecGroup[]): Promise<ResumeSpecGroup[]> {
  const allPregnancyPlanAlerts = await getAllPregnancyPlanAlerts();
  const allPregnancyMentionAlerts = await getAllPregnancyMentionAlerts();
  const allPediatricsInfo = await getAllPediatrics();

  return specsGroups.map((group) => {
    const pregnancyPlanAlert = allPregnancyPlanAlerts.find((s) =>
      group.subsIds.find((id) => Number(id.trim()) === Number(s.id)),
    );

    const pediatricsInfo = {
      contraindication: false,
    }
    let pregnancyMentionAlert = false;
    const specialites: ShortSpecialite[] = group.shortSpecialites.map((spec: ShortSpecialite) => {
      const pediatrics = allPediatricsInfo.find((info) => info.CIS === spec.SpecId);
      if (pediatrics) {
        pediatricsInfo.contraindication = pediatrics.contraindication;
      }
      const pregnancyAlert = allPregnancyMentionAlerts.find((mentionCIS) => mentionCIS === spec.SpecId);
      if (pregnancyAlert) pregnancyMentionAlert = true;
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
        pediatrics: pediatricsInfo ?? undefined,
      },
      shortSpecialites: specialites,
    }
  })
}