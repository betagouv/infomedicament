import { getGristTableData } from "@/data/grist/index";
import { PregnancyAlert } from "@/types/PregancyTypes";

export async function getPregnancySubsAlerts(): Promise <PregnancyAlert[]> {
  const records = await getGristTableData(
    "Grossesse_substances_contre_indiquees",
    ["SubsId", "Lien_site_ANSM"],
  );

  return records.map(({ fields }) => ({
    id: fields.SubsId as string,
    link: fields.Lien_site_ANSM as string,
  }));
}

export async function getPregnancyCISAlert(
  CIS: string
): Promise <boolean> {
  const records = await getGristTableData(
    "Grossesse_mention",
    ["CIS"],
  );

  const record = records.find(
    ({ fields }) => fields.CIS.toString().trim() === CIS,
  );

  if (!record) {
    return false;
  }

  return true;
}
