"use server";
import "server-cli-only";

import { cacheLife } from "next/cache";
import { pdbmMySQL } from "../pdbmMySQL";
import { SubstanceNom } from "../pdbmMySQL/types";
import { withOneSubstance } from "./query";
import { SpecialiteWithSubstance } from "@/types/SpecialiteTypes";
import { ResumeSubstance } from "../types";
import db from "..";
import { sql } from "kysely";

export async function getSubstances(
  ids: string[],
): Promise<SubstanceNom[] | undefined> {
  "use cache: remote";
  cacheLife("daily");

  return await pdbmMySQL
    .selectFrom("Subs_Nom")
    .where("NomId", "in", ids)
    .selectAll()
    .execute();
}

export async function getAllSubsWithSpecialites() {
  "use cache: remote";
  cacheLife("daily");

  return await pdbmMySQL
    .selectFrom("Subs_Nom")
    .innerJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
    .innerJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .where((eb) =>
      withOneSubstance(eb.ref("Specialite.SpecId"), eb.ref("Subs_Nom.NomId")),
    )
    .where("Specialite.IsBdm", "=", 1)
    .selectAll("Subs_Nom")
    .select("Specialite.SpecDenom01")
    .distinct()
    .orderBy("Subs_Nom.NomLib")
    .execute();
}

//Get all the specialites who contains at least one substance
export async function getSubstanceAllSpecialites(
  substanceIDs: string[],
): Promise<SpecialiteWithSubstance[]> {
  "use cache: remote";
  cacheLife("hourly");

  if (substanceIDs.length === 0) return [];
  return pdbmMySQL
    .selectFrom("Specialite")
    .innerJoin("Composant", "Specialite.SpecId", "Composant.SpecId")
    .innerJoin("Subs_Nom", "Composant.NomId", "Subs_Nom.NomId")
    .where("Composant.NomId", "in", substanceIDs)
    .where((eb) =>
      withOneSubstance(eb.ref("Specialite.SpecId"), eb.ref("Subs_Nom.NomId")),
    )
    .where("Specialite.IsBdm", "=", 1)
    .selectAll("Specialite")
    .select("Subs_Nom.NomId")
    .groupBy(["Specialite.SpecId", "Subs_Nom.NomId"])
    .orderBy("Subs_Nom.NomId")
    .distinct()
    .execute();
}

export async function getSubstancesResumeWithLetter(
  letter: string,
): Promise<ResumeSubstance[]> {
  "use cache: remote";
  cacheLife("daily");

  const result: ResumeSubstance[] = await db
    .selectFrom("resume_substances")
    .where(({ eb, ref }) =>
      eb(
        sql<string>`upper(${ref("NomLib")})`,
        "like",
        `${letter.toUpperCase()}%`,
      ),
    )
    .selectAll()
    .orderBy("NomLib")
    .execute();
  return result;
}

export async function getSubstancesResume(
  substanceIDs: string[],
): Promise<ResumeSubstance[]> {
  "use cache: remote";
  cacheLife("daily");

  if (substanceIDs.length === 0) return [];
  const result: ResumeSubstance[] = await db
    .selectFrom("resume_substances")
    .selectAll()
    .where("NomId", "in", substanceIDs)
    .orderBy("NomLib")
    .execute();
  return result;
}

export async function getSubstanceDefinition(ids: string[], subsIds: string[]) {
  "use cache: remote";
  cacheLife("daily");

  const rows = await db
    .selectFrom("ref_substance_active_definitions")
    .select(["nom_id", "subs_id", "sa", "definition"])
    .execute();

  // First try to match by NomId
  let definitions = rows.filter(
    (row) => row.nom_id && ids.includes(row.nom_id.trim()),
  );

  // If no match, try matching by SubsId
  if (definitions.length === 0) {
    definitions = rows.filter(
      (row) => row.subs_id && subsIds.includes(row.subs_id.trim()),
    );
  }

  // Map to the expected format (matching Grist structure)
  return definitions.map((row) => ({
    NomId: row.nom_id?.trim() || "",
    SA: row.sa?.trim() || "",
    Definition: row.definition?.trim() || "",
  }));
}
