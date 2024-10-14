import "server-only";
import atcOfficialLabels from "@/data/ATC 2024 02 15.json";
import { getGristTableData } from "@/data/grist";

async function getAtcLabel1(code: string): Promise<string> {
  const data = await getGristTableData("Table_Niveau_1");
  const record = data.find(
    (record: any) => record.fields.Lettre_1_ATC_1 === code.slice(0, 1),
  );
  if (!record) {
    throw new Error(`ATC code not found: ${code.slice(0, 1)}`);
  }

  return record.fields.Libelles_niveau_1 as string;
}

async function getAtcLabel2(code: string): Promise<string> {
  const atcData = await getGristTableData("Table_Niveau_2");
  const record = atcData.find(
    (record: any) => record.fields.Lettre_2_ATC2 === code.slice(0, 3),
  );
  if (!record) {
    throw new Error(`ATC code not found: ${code.slice(0, 3)}`);
  }

  const libeleId = record.fields.Libelles_niveau_2;
  const libeleData = await getGristTableData("Intitules_possibles");
  const libeleRecord = libeleData.find((record: any) => record.id === libeleId);

  if (!libeleRecord) {
    throw new Error(`ATC code not found: ${code.slice(0, 3)}`);
  }

  return libeleRecord.fields.Libelles_niveau_2 as string;
}

async function getAtcOfficialLabel(code: string): Promise<string> {
  if (!(code.slice(0, 7) in atcOfficialLabels)) {
    throw new Error(`ATC code not found: ${code.slice(0, 7)}`);
  }

  return (atcOfficialLabels as Record<string, string>)[code.slice(0, 7)];
}

export async function getAtcLabels(atc: string): Promise<string[]> {
  return Promise.all(
    [getAtcLabel1, getAtcLabel2, getAtcOfficialLabel].map((f) => f(atc)),
  );
}
