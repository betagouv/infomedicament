import { getGristTableData } from "@/data/grist/index";

export interface PediatricsInfo {
  indication: boolean;
  contraindication: boolean;
  doctorAdvice: boolean;
}

const isOuiOrNon = (value: any): value is "oui" | "non" =>
  typeof value === "string" &&
  (value.trim() === "oui" || value.trim() === "non");

export async function getPediatrics(
  CIS: string,
): Promise<PediatricsInfo | undefined> {
  const records = await getGristTableData("Pediatrie", [
    "CIS",
    "indication",
    "contre_indication",
    "avis",
  ]);

  const record = records.find(
    ({ fields }) => fields.CIS.toString().trim() === CIS,
  );

  if (!record) {
    return;
  }

  if (
    !isOuiOrNon(record.fields.indication) ||
    !isOuiOrNon(record.fields.contre_indication) ||
    !isOuiOrNon(record.fields.avis)
  ) {
    throw new Error(
      `Unexpected value in pediatrics data for CIS ${CIS}: ${JSON.stringify(
        record.fields,
      )}`,
    );
  }

  if (record)
    return {
      indication: record.fields.indication.trim() === "oui",
      contraindication: record.fields.contre_indication.trim() === "oui",
      doctorAdvice: record.fields.avis.trim() === "oui",
    };
}
