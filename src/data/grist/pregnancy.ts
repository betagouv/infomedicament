import { getGristTableData } from "@/data/grist/index";

export async function getPregnancyAlerts() {
  const records = await getGristTableData(
    "Grossesse_substances_contre_indiquees",
    ["SubsId", "Lien_site_ANSM"],
  );

  return records.map(({ fields }) => ({
    id: fields.SubsId as string,
    link: fields.Lien_site_ANSM as string,
  }));
}
