"use server";

import "server-cli-only";
import atcOfficialLabels from "@/data/ATC 2024 02 15.json";
import { getGristTableData } from "@/data/grist/index";
import { ATCError } from "@/utils/atc";
import { ATC, ATC1 } from "@/types/ATCTypes";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

export const getAtc = async function (): Promise<ATC1[]> {
  const data = await getGristTableData("Table_Niveau_1", [
    "Lettre_1_ATC_1",
    "Libelles_niveau_1",
    "Definition_Classe",
  ]);
  const childrenData = await getGristTableData("Table_Niveau_2", [
    "Libelles_niveau_2",
    "Lettre_2_ATC2",
  ]);

  return Promise.all(
    data.map(async (record) => ({
      code: record.fields.Lettre_1_ATC_1 as string,
      label: record.fields.Libelles_niveau_1 as string,
      description: record.fields.Definition_Classe as string,
      children: await Promise.all(
        childrenData
          .filter((childRecord) =>
            (childRecord.fields.Lettre_2_ATC2 as string).startsWith(
              record.fields.Lettre_1_ATC_1 as string,
            ),
          )
          .map(async (record) =>
            getAtc2(record.fields.Lettre_2_ATC2 as string, childrenData),
          ),
      ),
    })),
  );
};

export const getAtc1 = async function (code: string): Promise<ATC1> {
  const data = await getGristTableData("Table_Niveau_1", [
    "Lettre_1_ATC_1",
    "Libelles_niveau_1",
    "Definition_Classe",
  ]);
  const record = data.find(
    (record) => record.fields.Lettre_1_ATC_1 === code.slice(0, 1),
  );
  if (!record) {
    throw new ATCError(code.slice(0, 3));
  }

  const childrenData = await getGristTableData("Table_Niveau_2", [
    "Libelles_niveau_2",
    "Lettre_2_ATC2",
  ]);
  const children = await Promise.all(
    childrenData
      .filter((record) =>
        (record.fields.Lettre_2_ATC2 as string).startsWith(code.slice(0, 1)),
      )
      .map(async (record) => getAtc2(record.fields.Lettre_2_ATC2 as string, childrenData)),
  );

  return {
    code: record.fields.Lettre_1_ATC_1 as string,
    label: record.fields.Libelles_niveau_1 as string,
    description: record.fields.Definition_Classe as string,
    children,
  };
};

export const getAtc2 = async function (code: string, tableNiveau2?: any): Promise<ATC> {
  const data = tableNiveau2 
    ? tableNiveau2 
    : await getGristTableData("Table_Niveau_2", [
      "Libelles_niveau_2",
      "Lettre_2_ATC2",
    ]);
  const record = data.find(
    (record: any) => record.fields.Lettre_2_ATC2 === code.slice(0, 3),
  );

  if (!record) {
    throw new ATCError(code.slice(0, 3));
  }

  const libeleId = record.fields.Libelles_niveau_2;
  const libeleData = await getGristTableData("Intitules_possibles", [
    "Libelles_niveau_2",
    "Definition_sous_classe",
  ]);
  const libeleRecord = libeleData.find((record) => record.id === libeleId);

  if (!libeleRecord) {
    throw new ATCError(code.slice(0, 3));
  }

  return {
    code: record.fields.Lettre_2_ATC2 as string,
    label: libeleRecord.fields.Libelles_niveau_2 as string,
    description: libeleRecord.fields.Definition_sous_classe as string,
    children: Object.keys(atcOfficialLabels)
      .filter((key) => key.startsWith(code))
      .map((key) => ({
        code: key,
        label: (atcOfficialLabels as Record<string, string>)[key],
        description: "",
      })),
  };
};

export const getResumeSpecsGroupsATCLabels = async function (specsGroups: ResumeSpecGroup[]): Promise<ResumeSpecGroup[]> {
  const allATC1 = await getGristTableData("Table_Niveau_1", [
    "Lettre_1_ATC_1",
    "Libelles_niveau_1",
    "Definition_Classe",
  ]);
  const allATC2 = await getGristTableData("Table_Niveau_2", [
    "Libelles_niveau_2",
    "Lettre_2_ATC2",
  ]);
  const allATC2Labels = await getGristTableData("Intitules_possibles", [
    "Libelles_niveau_2",
    "Definition_sous_classe",
  ]);
  return specsGroups.map((spec: ResumeSpecGroup) => {
    let atc1Label = "";
    let atc2Label = "";
    if(spec.atc1Code){
      const atc1 = allATC1.find(
        (record) => record.fields.Lettre_1_ATC_1 === spec.atc1Code
      )
      if(atc1) atc1Label = atc1.fields.Libelles_niveau_1 as string;
    }
    if(spec.atc2Code){
      const atc2 = allATC2.find(
        (record) => record.fields.Lettre_2_ATC2 === spec.atc2Code
      )
      if(atc2){      
        const atc2LabelData = allATC2Labels.find((record) => record.id === atc2.fields.Libelles_niveau_2);
        if(atc2LabelData) atc2Label = atc2LabelData.fields.Libelles_niveau_2 as string;
      }
    }
    return {
      atc1Label: atc1Label,
      atc2Label: atc2Label,
      ...spec,
    }
  });
}