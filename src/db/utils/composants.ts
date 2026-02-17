"use server";
import "server-cli-only";

import { cache } from "react";
import { SpecComposant, SubstanceNom } from "../pdbmMySQL/types";
import { pdbmMySQL } from "../pdbmMySQL";

export const getComposants = cache(async function (CIS: string) {
  return await getComposantsList([CIS]);
});

export const getComposantsList = cache(async (CISList: string[]) => {
  if(CISList.length > 0) {
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
});