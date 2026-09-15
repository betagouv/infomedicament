"use server";
import "server-cli-only";

import { pdbmMySQL } from "../pdbmMySQL";
import { SubstanceNom } from "../pdbmMySQL/types";
import { cache } from "react";
import { withOneSubstance } from "./query";
import { ResumeSubstance } from "../types";
import db from "..";
import { sql } from "kysely";

export const getSubstances = cache(async function (
  subsIds: string[]
): Promise<SubstanceNom[] | undefined> {
  return await pdbmMySQL
    .selectFrom("Subs_Nom")
    .where("SubsId", "in", subsIds)
    .selectAll()
    .execute();
});

export const getAllSubsWithSpecialites = cache(async function () {
  return await pdbmMySQL
    .selectFrom("Subs_Nom")
    .innerJoin("Composant", "Subs_Nom.SubsId", "Composant.SubsId")
    .innerJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .where((eb) => withOneSubstance(eb.ref("Specialite.SpecId"), eb.ref("Subs_Nom.SubsId")))
    .where("Specialite.IsBdm", "=", 1)
    .selectAll("Subs_Nom")
    .select("Specialite.SpecDenom01")
    .distinct()
    .orderBy("Subs_Nom.NomLib")
    .execute();
});

export const getSubstancesResumeWithLetter = cache(async function (letter: string): Promise<ResumeSubstance[]> {
  const result: ResumeSubstance[] = await db
    .selectFrom("resume_substances")
    .where(({ eb, ref }) => eb(
      sql<string>`upper(${ref("NomLib")})`, "like", `${letter.toUpperCase()}%`
    ))
    .selectAll()
    .orderBy("NomLib")
    .execute();
  return result;
});

export const getSubstancesResume = cache(async function (subsIds: string[]): Promise<ResumeSubstance[]> {
  if (subsIds.length === 0) return [];
  const result: ResumeSubstance[] = await db
    .selectFrom("resume_substances")
    .selectAll()
    .where("SubsId", "in", subsIds)
    .orderBy("NomLib")
    .execute();
  return result;
});

export async function getSubstanceDefinition(
  subsIds: string[],
) {
  const rows = await db.selectFrom("ref_substance_active_definitions")
    .select(["nom_id", "subs_id", "sa", "definition"])
    .execute();

  // First try to match by NomId
  let definitions = rows.filter((row) =>
    row.subs_id && subsIds.includes(row.subs_id.trim())
  );

  // Map to the expected format (matching Grist structure)
  return definitions.map((row) => (
    {
      SubsId: row.subs_id?.trim() || "",
      SA: row.sa?.trim() || "",
      Definition: row.definition?.trim() || "",
    }
  ));
}
