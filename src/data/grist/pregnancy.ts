import { getGristTableData } from "@/data/grist/index";
import { PregnancyAlert } from "@/types/PregancyTypes";

export async function getPregnancyAlerts(): Promise <PregnancyAlert[]> {
  const records = await getGristTableData(
    "Grossesse_substances_contre_indiquees",
    ["SubsId", "Lien_site_ANSM"],
  );

  return records.map(({ fields }) => ({
    id: fields.SubsId as string,
    link: fields.Lien_site_ANSM as string,
  }));
}
