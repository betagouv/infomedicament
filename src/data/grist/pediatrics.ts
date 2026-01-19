"use server"

import { getGristTableData } from "@/data/grist/index";
import { AllPediatricsInfo, PediatricsInfo } from "@/types/PediatricTypes";
import { isOuiOrNon } from "@/utils/pediatrics";

export async function getAllPediatrics(): Promise<AllPediatricsInfo[]> {
  const records = await getGristTableData("Pediatrie", [
    "CIS",
    "indication",
    "contre_indication",
    "avis",
    "mention",
  ]);

  return records.map(({ fields }) => ({
    CIS: fields.CIS.toString().trim(),
    indication: fields.indication.toString().trim() === "oui",
    contraindication: fields.contre_indication.toString().trim() === "oui",
    doctorAdvice: fields.avis.toString().trim() === "oui",
    mention: fields.mention.toString().trim() === "oui",
  }));
}

export async function getPediatrics(
  CIS: string,
): Promise<PediatricsInfo | undefined> {
  const records = await getGristTableData("Pediatrie", [
    "CIS",
    "indication",
    "contre_indication",
    "avis",
    "mention",
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
    !isOuiOrNon(record.fields.avis) ||
    !isOuiOrNon(record.fields.mention)
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
      mention: record.fields.mention.trim() === "oui",
    };
}
