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

export async function getPediatricsForList(
  CISList: string[],
): Promise<PediatricsInfo | undefined> {
  const records = await getGristTableData("Pediatrie", [
    "CIS",
    "indication",
    "contre_indication",
    "avis",
  ]);

  const pediatricsInfo = {
    indication: false,
    contraindication: false,
    doctorAdvice: false,
  }
  records.forEach(({ fields }) => {
    if(CISList.includes(fields.CIS.toString().trim())){
      if (
        !isOuiOrNon(fields.indication) ||
        !isOuiOrNon(fields.contre_indication) ||
        !isOuiOrNon(fields.avis)
        ) {
        throw new Error(
          `Unexpected value in pediatrics data for CIS ${fields.CIS}: ${JSON.stringify(
            fields,
          )}`,
        );
      }
      fields.indication.trim() === "oui" && (pediatricsInfo.indication = true);
      fields.contre_indication.trim() === "oui" && (pediatricsInfo.contraindication = true);
      fields.avis.trim() === "oui" && (pediatricsInfo.doctorAdvice = true);
    }
  });

  if (!pediatricsInfo.indication && !pediatricsInfo.contraindication && !pediatricsInfo.doctorAdvice) {
    return;
  }
  return pediatricsInfo;
}
