import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";

import atcOfficialLabels from "@/data/ATC 2024 02 15.json";

async function getGristTableData(tableId: string) {
  const response = await fetch(
    `https://grist.numerique.gouv.fr/api/docs/${process.env.GRIST_DOC_ID}/tables/${tableId}/records`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GRIST_API_KEY}`,
      },
    },
  );
  return await response.json();
}

interface ATC {
  code: string;
  label: string;
  description: string;
  children?: ATC[];
}

export const getAtc = cache(async function (): Promise<ATC[]> {
  const data = await getGristTableData("Table_Niveau_1");
  const childrenData = await getGristTableData("Table_Niveau_2");
  return await Promise.all(
    data.records.map(async (record: any) => {
      const children = await Promise.all(
        childrenData.records
          .filter((record: any) =>
            record.fields.Lettre_2_ATC2.startsWith(
              record.fields.Lettre_1_ATC_1,
            ),
          )
          .map(async (record: any) => getAtc2(record.fields.Lettre_2_ATC2)),
      );
      return {
        code: record.fields.Lettre_1_ATC_1 as string,
        label: record.fields.Libelles_niveau_1 as string,
        description: record.fields.Definition_Classe as string,
        children,
      };
    }),
  );
});

export const getAtc1 = cache(async function (code: string): Promise<ATC> {
  const data = await getGristTableData("Table_Niveau_1");
  const record = data.records.find(
    (record: any) => record.fields.Lettre_1_ATC_1 === code.slice(0, 1),
  );
  if (!record) notFound();

  const childrenData = await getGristTableData("Table_Niveau_2");
  const children = await Promise.all(
    childrenData.records
      .filter((record: any) =>
        record.fields.Lettre_2_ATC2.startsWith(code.slice(0, 1)),
      )
      .map(async (record: any) => await getAtc2(record.fields.Lettre_2_ATC2)),
  );

  return {
    code: record.fields.Lettre_1_ATC_1 as string,
    label: record.fields.Libelles_niveau_1 as string,
    description: record.fields.Definition_Classe as string,
    children,
  };
});

export const getAtc2 = cache(async function (code: string): Promise<ATC> {
  const data = await getGristTableData("Table_Niveau_2");
  const record = data.records.find(
    (record: any) => record.fields.Lettre_2_ATC2 === code.slice(0, 3),
  );

  if (!record) notFound();

  const libeleId = record.fields.Libelles_niveau_2;
  const libeleData = await getGristTableData("Intitules_possibles");
  const libeleRecord = libeleData.records.find(
    (record: any) => record.id === libeleId,
  );

  if (!libeleRecord) notFound();

  return {
    code: record.fields.Lettre_2_ATC2 as string,
    label: libeleRecord.fields.Libelles_niveau_2 as string,
    description: "",
    children: Object.keys(atcOfficialLabels)
      .filter((key) => key.startsWith(code))
      .map((key) => ({
        code: key,
        label: (atcOfficialLabels as Record<string, string>)[key],
        description: "",
      })),
  };
});

async function getAtcOfficialLabel(code: string): Promise<string> {
  if (!(code.slice(0, 7) in atcOfficialLabels)) {
    throw new Error(`ATC code not found: ${code.slice(0, 7)}`);
  }

  return (atcOfficialLabels as Record<string, string>)[code.slice(0, 7)];
}

export async function getAtcLabels(atc: string): Promise<string[]> {
  return Promise.all(
    [
      async (code: string) => (await getAtc1(code)).label,
      async (code: string) => (await getAtc2(code)).label,
      getAtcOfficialLabel,
    ].map((f) => f(atc)),
  );
}
