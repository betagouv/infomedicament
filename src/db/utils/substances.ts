"use server";

import { pdbmMySQL } from "../pdbmMySQL";

export async function getAllSubsWithSpecialites() {
  "use cache";
  return pdbmMySQL
    .selectFrom("Subs_Nom")
    .innerJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
    .innerJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .selectAll("Subs_Nom")
    .select("Specialite.SpecDenom01")
    .distinct()
    .orderBy("Subs_Nom.NomLib")
    .execute();
};