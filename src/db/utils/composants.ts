"use server";
import "server-cli-only";

import { cacheLife } from "next/cache";
import { SpecComposant, SubstanceNom } from "../pdbmMySQL/types";
import { pdbmMySQL } from "../pdbmMySQL";

export async function getComposants(CIS: string) {
  return getComposantsList([CIS]);
}

export async function getComposantsList(CISList: string[]) {
  "use cache: remote";
  cacheLife("hourly");

  if (CISList.length > 0) {
    const composants: Array<SpecComposant & SubstanceNom> = (
      await pdbmMySQL
        .selectFrom("Composant")
        .innerJoin("Element", "Composant.ElmtNum", "Element.ElmtNum")
        .innerJoin("Subs_Nom", "Composant.NomId", "Subs_Nom.NomId")
        .where("Element.SpecId", "in", CISList)
        .where("Composant.SpecId", "in", CISList)
        .selectAll("Composant")
        .selectAll("Subs_Nom")
        .distinct()
        .execute()
    ).flat();

    return composants;
  }
  return [];
}
