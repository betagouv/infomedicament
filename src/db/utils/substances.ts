"use server";
import "server-cli-only";

import { unstable_cache } from "next/cache";
import { SubstanceNom } from "../pdbmMySQL/types";
import { cache } from "react";
import { SpecialiteWithSubstance } from "@/types/SpecialiteTypes";
import { ResumeSubstance } from "../types";
import db from "..";
import { sql } from "kysely";

export const getSubstances = cache(async function (
  ids: string[]
): Promise<SubstanceNom[] | undefined> {
  // Accept both SubsId (new bdpm_ URLs) and NomId (legacy bookmarks)
  return await db
    .selectFrom("resume_substances")
    .where((eb) => eb.or([
      eb("SubsId", "in", ids),
      eb("NomId", "in", ids),
    ]))
    .selectAll()
    .execute() as SubstanceNom[];
});

// Returns a map of cis → code_substance for drugs with exactly one active substance code.
// Done in JS to avoid Kysely HAVING aggregate syntax issues.
async function buildSingleSubMap(): Promise<Map<string, string>> {
  const rows = await db
    .selectFrom("ansm_composant")
    .where("code_substance", "is not", null)
    .select(["cis", "code_substance"])
    .distinct()
    .execute();

  const cisToSubs = new Map<string, string[]>();
  for (const row of rows) {
    const existing = cisToSubs.get(row.cis) ?? [];
    existing.push(row.code_substance!);
    cisToSubs.set(row.cis, existing);
  }

  const result = new Map<string, string>();
  for (const [cis, subs] of cisToSubs) {
    if (subs.length === 1) result.set(cis, subs[0]);
  }
  return result;
}

export const getAllSubsWithSpecialites = cache(async function () {
  // cis → code_substance for single-active-substance drugs
  const singleSubMap = await buildSingleSubMap();
  if (singleSubMap.size === 0) return [];

  const singleSubCIS = [...singleSubMap.keys()];
  const singleSubCodes = [...new Set(singleSubMap.values())];

  // Get substance names from ansm_composant — use code_substance as both SubsId and NomId
  const substanceNames = await db
    .selectFrom("ansm_composant")
    .where("code_substance", "in", singleSubCodes)
    .select(["code_substance", "substance"])
    .distinct()
    .execute();

  const subsIdToSub = new Map(
    substanceNames.map((s) => [
      s.code_substance!,
      { SubsId: s.code_substance!, NomId: s.code_substance!, NomLib: s.substance ?? "" },
    ])
  );

  // Get active specialites from those CIS
  const specialites = await db
    .selectFrom("ansm_specialite")
    .where("cis", "in", singleSubCIS)
    .where("disponibilite", "!=", "INDISPONIBLE")
    .select(["cis", "denomination"])
    .execute();

  // Combine: for each active CIS, attach its substance info + denomination
  const seen = new Set<string>();
  const result: (SubstanceNom & { SpecDenom01: string })[] = [];

  for (const sp of specialites) {
    const subsId = singleSubMap.get(sp.cis);
    if (!subsId) continue;
    const sub = subsIdToSub.get(subsId);
    if (!sub) continue;
    const key = `${subsId}:${sp.denomination}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...sub, SpecDenom01: sp.denomination ?? "" } as SubstanceNom & { SpecDenom01: string });
  }

  result.sort((a, b) => a.NomLib.localeCompare(b.NomLib));
  return result;
});

export const getSubstanceAllSpecialites = unstable_cache(async function (
  substanceIDs: string[]
): Promise<SpecialiteWithSubstance[]> {
  if (substanceIDs.length === 0) return [];

  // substanceIDs are NomIds — get their SubsIds from resume_substances
  const subsRows = await db
    .selectFrom("resume_substances")
    .where("NomId", "in", substanceIDs)
    .select(["NomId", "SubsId"])
    .execute();

  const subsIds = subsRows.map((r) => r.SubsId).filter((id): id is string => id !== null);
  if (subsIds.length === 0) return [];

  const singleSubMap = await buildSingleSubMap();
  if (singleSubMap.size === 0) return [];

  // Get CIS codes that use one of the target substances and have a single active substance
  const targetCIS = [...singleSubMap.entries()]
    .filter(([, code]) => subsIds.includes(code))
    .map(([cis]) => cis);
  if (targetCIS.length === 0) return [];

  const rows = await db
    .selectFrom("ansm_specialite")
    .where("cis", "in", targetCIS)
    .where("disponibilite", "!=", "INDISPONIBLE")
    .selectAll()
    .execute();

  // Attach NomId via the singleSubMap → subsId → subsRows lookup
  const subsIdToNomId = new Map(subsRows.map((r) => [r.SubsId, r.NomId]));

  return rows.map((row) => ({
    ...row,
    NomId: subsIdToNomId.get(singleSubMap.get(row.cis) ?? "") ?? "",
  })) as unknown as SpecialiteWithSubstance[];
},
  ["substance-all-specialites"],
  { revalidate: 3600 }
);

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

export const getSubstancesResume = cache(async function (substanceIDs: string[]): Promise<ResumeSubstance[]> {
  if (substanceIDs.length === 0) return [];
  const result: ResumeSubstance[] = await db
    .selectFrom("resume_substances")
    .selectAll()
    .where("NomId", "in", substanceIDs)
    .orderBy("NomLib")
    .execute();
  return result;
});

export async function getSubstanceDefinition(
  ids: string[],
  subsIds: string[],
) {
  const rows = await db.selectFrom("ref_substance_active_definitions")
    .select(["nom_id", "subs_id", "sa", "definition"])
    .execute();

  // First try to match by NomId
  let definitions = rows.filter((row) =>
    row.nom_id && ids.includes(row.nom_id.trim())
  );

  // If no match, try matching by SubsId
  if (definitions.length === 0) {
    definitions = rows.filter((row) =>
      row.subs_id && subsIds.includes(row.subs_id.trim())
    );
  }

  // Map to the expected format (matching Grist structure)
  return definitions.map((row) => (
    {
      NomId: row.nom_id?.trim() || "",
      SA: row.sa?.trim() || "",
      Definition: row.definition?.trim() || "",
    }
  ));
}
