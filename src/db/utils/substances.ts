"use server";
import { cacheLife } from "next/cache";
import "server-cli-only";



import type { SpecialiteWithSubstance } from "@/types/SpecialiteTypes";
import type { ResumeSubstance, AnsmComposant } from "../types";
import db from "..";
import { sql } from "kysely";
import type { Substance } from "@/types/SubstanceTypes";
import {
  compositionMatchesSubstanceSet,
  hasExactlyOneComponent,
  toCompositionComponents,
  toSubstance,
} from "./substanceCatalog";
import {
  mapCatalogSpecialite,
  VISIBLE_SPECIALITE_AVAILABILITIES,
} from "./specialiteCatalog";

type SubstanceSetComponent = Pick<
  AnsmComposant,
  "cis" | "numero_element" | "numero_composant" | "ordre" | "code_substance"
>;

async function resolveSubstances(ids: string[]): Promise<Substance[]> {
  if (ids.length === 0) return [];

  const [ansmNames, resumeFallbacks] = await Promise.all([
    db
      .selectFrom("ansm_substance_nom")
      .where((eb) =>
        eb.or([eb("code_nom", "in", ids), eb("code_substance", "in", ids)]),
      )
      .selectAll()
      .execute(),
    db
      .selectFrom("resume_substances")
      .where((eb) => eb.or([eb("NomId", "in", ids), eb("SubsId", "in", ids)]))
      .select(["SubsId", "NomId", "NomLib"])
      .execute(),
  ]);

  const resolved = ids.flatMap((id) => {
    const exactName = ansmNames.find((row) => row.code_nom === id);
    if (exactName) return [toSubstance(exactName)];

    const canonical =
      ansmNames.find(
        (row) => row.code_substance === id && row.type === "CANONIQUE",
      ) ?? ansmNames.find((row) => row.code_substance === id);
    if (canonical) return [toSubstance(canonical)];

    const fallback = resumeFallbacks.find(
      (row) => row.NomId.trim() === id || row.SubsId.trim() === id,
    );
    return fallback
      ? [
          {
            SubsId: fallback.SubsId.trim(),
            NomId: fallback.NomId.trim(),
            NomLib: fallback.NomLib.trim(),
          },
        ]
      : [];
  });

  return resolved.filter(
    (substance, index, all) =>
      all.findIndex((candidate) => candidate.NomId === substance.NomId) ===
      index,
  );
}

async function componentsForCandidateCis(
  substanceCodes: string[],
): Promise<Map<string, SubstanceSetComponent[]>> {
  if (substanceCodes.length === 0) return new Map();

  const targetRows = await db
    .selectFrom("ansm_composant")
    .where("code_substance", "in", substanceCodes)
    .select([
      "cis",
      "numero_element",
      "numero_composant",
      "ordre",
      "code_substance",
    ])
    .execute();
  const candidateCis = [...new Set(targetRows.map((row) => row.cis))];
  if (candidateCis.length === 0) return new Map();

  const allRows = await db
    .selectFrom("ansm_composant")
    .where("cis", "in", candidateCis)
    .select([
      "cis",
      "numero_element",
      "numero_composant",
      "ordre",
      "code_substance",
    ])
    .execute();
  const byCis = new Map<string, SubstanceSetComponent[]>();
  for (const row of allRows) {
    const rows = byCis.get(row.cis) ?? [];
    rows.push(row);
    byCis.set(row.cis, rows);
  }
  return byCis;
}

export async function getCisMatchingSubstanceSet(
  ids: string[],
): Promise<string[]> {
  const substances = await resolveSubstances(ids);
  if (substances.length !== ids.length) return [];

  const substanceCodes = substances.map((substance) => substance.SubsId);
  const byCis = await componentsForCandidateCis(substanceCodes);
  return [...byCis.entries()]
    .filter(([, components]) =>
      compositionMatchesSubstanceSet(components, substanceCodes),
    )
    .map(([cis]) => cis);
}

export async function getSubstances(ids: string[]): Promise<Substance[]> {
  "use cache: remote";
  cacheLife("daily");
  return resolveSubstances(ids);
}

export async function getAllSubsWithSpecialites() {
  "use cache: remote";
  cacheLife("daily");
  const [components, names, specialites] = await Promise.all([
    db.selectFrom("ansm_composant").selectAll().execute(),
    db.selectFrom("ansm_substance_nom").selectAll().execute(),
    db
      .selectFrom("ansm_specialite")
      .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .select(["cis", "denomination"])
      .execute(),
  ]);
  const byCis = new Map<string, typeof components>();
  for (const component of components) {
    const rows = byCis.get(component.cis) ?? [];
    rows.push(component);
    byCis.set(component.cis, rows);
  }
  const singleComponentCis = new Set(
    [...byCis.entries()]
      .filter(([, rows]) => hasExactlyOneComponent(rows))
      .map(([cis]) => cis),
  );
  const mappedComponents = toCompositionComponents(
    components.filter((component) => singleComponentCis.has(component.cis)),
    names,
    [],
  );
  const denominationByCis = new Map(
    specialites.map((specialite) => [
      specialite.cis,
      specialite.denomination ?? "",
    ]),
  );
  const seen = new Set<string>();

  return mappedComponents
    .flatMap((component) => {
      const denomination = denominationByCis.get(component.SpecId);
      return denomination === undefined
        ? []
        : [
            {
              SubsId: component.SubsId,
              NomId: component.NomId,
              NomLib: component.NomLib,
              SpecDenom01: denomination,
            },
          ];
    })
    .filter((row) => {
      const key = `${row.NomId}:${row.SpecDenom01}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.NomLib.localeCompare(right.NomLib, "fr"));
}

export async function getSubstanceAllSpecialites(substanceIDs: string[]): Promise<SpecialiteWithSubstance[]> {
  "use cache: remote";
  cacheLife("hourly");
    if (substanceIDs.length === 0) return [];
    const substances = await resolveSubstances(substanceIDs);
    const codeToNomIds = new Map<string, string[]>();
    for (const substance of substances) {
      const ids = codeToNomIds.get(substance.SubsId) ?? [];
      ids.push(substance.NomId);
      codeToNomIds.set(substance.SubsId, ids);
    }
    const byCis = await componentsForCandidateCis([...codeToNomIds.keys()]);
    const cisToNomIds = new Map<string, string[]>();
    for (const [cis, components] of byCis) {
      if (!hasExactlyOneComponent(components)) continue;
      // Preserve every requested name, including active fractions in the same
      // component, rather than letting one name overwrite another in a batch.
      const ids = new Set(components.flatMap((component) =>
        component.code_substance
          ? codeToNomIds.get(component.code_substance) ?? []
          : [],
      ));
      if (ids.size > 0) cisToNomIds.set(cis, [...ids]);
    }
    if (cisToNomIds.size === 0) return [];

    const rows = await db
      .selectFrom("ansm_specialite")
      .where("cis", "in", [...cisToNomIds.keys()])
      .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .selectAll()
      .execute();
    return rows.flatMap((row) =>
      (cisToNomIds.get(row.cis) ?? []).map((NomId) => ({
        ...mapCatalogSpecialite(row),
        NomId,
      })),
    );
  }

export async function getSubstancesResumeWithLetter(letter: string): Promise<ResumeSubstance[]> {
  "use cache: remote";
  cacheLife("daily");
  return db
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
}

export async function getSubstancesResume(substanceIDs: string[]): Promise<ResumeSubstance[]> {
  "use cache: remote";
  cacheLife("daily");
  if (substanceIDs.length === 0) return [];
  return db
    .selectFrom("resume_substances")
    .selectAll()
    .where("NomId", "in", substanceIDs)
    .orderBy("NomLib")
    .execute();
}

export const getAllSubstancesResumes = cache(
  async function (): Promise<ResumeSubstance[]> 
{
  return db
    .selectFrom("resume_substances")
    .selectAll()
    .orderBy("NomLib")
    .execute() ;
});

export async function getSubstanceDefinition(ids: string[], subsIds: string[]) {
  "use cache: remote";
  cacheLife("daily");
  const rows = await db
    .selectFrom("ref_substance_active_definitions")
    .select(["nom_id", "subs_id", "sa", "definition"])
    .execute();
  let definitions = rows.filter(
    (row) => row.nom_id && ids.includes(row.nom_id.trim()),
  );
  if (definitions.length === 0) {
    definitions = rows.filter(
      (row) => row.subs_id && subsIds.includes(row.subs_id.trim()),
    );
  }
  return definitions.map((row) => ({
    NomId: row.nom_id?.trim() || "",
    SA: row.sa?.trim() || "",
    Definition: row.definition?.trim() || "",
  }));
}
