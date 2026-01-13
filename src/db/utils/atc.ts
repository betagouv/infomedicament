"use server";

import { cache } from "react";
import { pdbmMySQL } from "../pdbmMySQL";
import { atcData } from "@/utils/atc";
import { ATC } from "@/types/ATCTypes";
import { SubstanceNom } from "../pdbmMySQL/types";

export const getSubstancesByAtc = cache(async (atc2: ATC): Promise<SubstanceNom[]> => {
  const CIS = (atc2.children as ATC[])
    .map((atc3) => atcData.filter((row: any) => row[1] === atc3.code))
    .map((rows) => rows.map((row) => row[0]))
    .flat();

  if (!CIS.length) return [];

  return pdbmMySQL
    .selectFrom("Subs_Nom")
    .leftJoin("Composant", "Composant.NomId", "Subs_Nom.NomId")
    .where("Composant.SpecId", "in", CIS)
    .selectAll("Subs_Nom")
    .groupBy(["Subs_Nom.NomId", "Subs_Nom.NomLib", "Subs_Nom.SubsId"])
    .orderBy("Subs_Nom.NomLib")
    .execute();
});
