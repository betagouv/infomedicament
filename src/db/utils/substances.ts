"use server";

import { unstable_cache } from "next/cache";
import { pdbmMySQL } from "../pdbmMySQL";
import { SubstanceNom } from "../pdbmMySQL/types";
import { cache } from "react";
import { withOneSubstance } from "./query";
import { SpecialiteWithSubstance } from "@/types/MedicamentTypes";

export const getSubstances = cache(async function (
  ids: string[]
): Promise<SubstanceNom[] | undefined> {
  return await pdbmMySQL
    .selectFrom("Subs_Nom")
    .where("NomId", "in", ids)
    .selectAll()
    .execute();
});

export const getAllSubsWithSpecialites = cache(async function () {
  //"use cache";
  return pdbmMySQL
    .selectFrom("Subs_Nom")
    .innerJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
    .innerJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .selectAll("Subs_Nom")
    .select("Specialite.SpecDenom01")
    .distinct()
    .orderBy("Subs_Nom.NomLib")
    .execute();
});

//Get all the specialites who contains at least one substance
export const getSubstanceAllSpecialites = unstable_cache(async function (
  substanceIDs: string[]
): Promise<SpecialiteWithSubstance[]> {
  return pdbmMySQL
    .selectFrom("Specialite")
    .innerJoin("Composant", "Specialite.SpecId", "Composant.SpecId")
    .innerJoin("Subs_Nom", "Composant.NomId", "Subs_Nom.NomId" )
    .where("Composant.NomId", "in", substanceIDs)
    .where((eb) => withOneSubstance(eb.ref("Specialite.SpecId"), eb.ref("Subs_Nom.NomId")))
    .selectAll("Specialite")
    .select("Subs_Nom.NomId")
    .groupBy(["Specialite.SpecId", "Subs_Nom.NomId"])
    .orderBy("Subs_Nom.NomId")
    .distinct()
    .execute();
});