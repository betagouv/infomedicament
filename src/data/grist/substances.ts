"use server";

import { getGristTableData } from "@/data/grist";

export async function getSubstanceDefinition(
  ids: string[],
  subsIds: string[],
) {
  const definitionsRaw = (
    await getGristTableData("Definitions_Substances_Actives", [
      "SubsId",
      "NomId",
      "SA",
      "Definition",
    ])
  );
  let definitions: any[] = [];
  if(definitionsRaw){
    definitions = definitionsRaw.filter((d) => ids.includes(d.fields.NomId as string)) as {
      fields: { NomId: string; SA: string; Definition: string };
    }[];
    if(definitions.length === 0){
      definitions = definitionsRaw.filter((d) => subsIds.includes((d.fields.SubsId as string).trim())) as {
        fields: { NomId: string; SA: string; Definition: string };
      }[];
    }
  }
  return definitions;
}