"use server";
import "server-cli-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { SpecialiteWithSubstance } from "@/types/SpecialiteTypes";
import type { ResumeSubstance, AnsmComposant } from "../types";
import db from "..";
import { sql } from "kysely";
import type { Substance } from "@/types/SubstanceTypes";
import {
  hasCompleteSubstanceSet,
  hasExactlyOneComponent,
  mapAnsmComposition,
  mapAnsmSubstance,
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
      .where((eb) => eb.or([
        eb("code_nom", "in", ids),
        eb("code_substance", "in", ids),
      ]))
      .selectAll()
      .execute(),
    db
      .selectFrom("resume_substances")
      .where((eb) => eb.or([
        eb("NomId", "in", ids),
        eb("SubsId", "in", ids),
      ]))
      .select(["SubsId", "NomId", "NomLib"])
      .execute(),
  ]);

  const resolved = ids.flatMap((id) => {
    const exactName = ansmNames.find((row) => row.code_nom === id);
    if (exactName) return [mapAnsmSubstance(exactName)];

    const canonical = ansmNames.find(
      (row) => row.code_substance === id && row.type === "CANONIQUE",
    ) ?? ansmNames.find((row) => row.code_substance === id);
    if (canonical) return [mapAnsmSubstance(canonical)];

    const fallback = resumeFallbacks.find(
      (row) => row.NomId.trim() === id || row.SubsId.trim() === id,
    );
    return fallback
      ? [{
        SubsId: fallback.SubsId.trim(),
        NomId: fallback.NomId.trim(),
        NomLib: fallback.NomLib.trim(),
      }]
      : [];
  });

  return resolved.filter(
    (substance, index, all) =>
      all.findIndex((candidate) => candidate.NomId === substance.NomId) === index,
  );
}

async function componentsForCandidateCis(
  substanceCodes: string[],
): Promise<Map<string, SubstanceSetComponent[]>> {
  if (substanceCodes.length === 0) return new Map();

  const targetRows = await db
    .selectFrom("ansm_composant")
    .where("code_substance", "in", substanceCodes)
    .select(["cis", "numero_element", "numero_composant", "ordre", "code_substance"])
    .execute();
  const candidateCis = [...new Set(targetRows.map((row) => row.cis))];
  if (candidateCis.length === 0) return new Map();

  const allRows = await db
    .selectFrom("ansm_composant")
    .where("cis", "in", candidateCis)
    .select(["cis", "numero_element", "numero_composant", "ordre", "code_substance"])
    .execute();
  const byCis = new Map<string, SubstanceSetComponent[]>();
  for (const row of allRows) {
    const rows = byCis.get(row.cis) ?? [];
    rows.push(row);
    byCis.set(row.cis, rows);
  }
  return byCis;
}

export async function getCisWithCompleteSubstances(ids: string[]): Promise<string[]> {
  const substances = await resolveSubstances(ids);
  if (substances.length !== ids.length) return [];

  const substanceCodes = substances.map((substance) => substance.SubsId);
  const byCis = await componentsForCandidateCis(substanceCodes);
  return [...byCis.entries()]
    .filter(([, components]) => hasCompleteSubstanceSet(components, substanceCodes))
    .map(([cis]) => cis);
}

export const getSubstances = cache(async function (ids: string[]): Promise<Substance[]> {
  return resolveSubstances(ids);
});

export const getAllSubsWithSpecialites = cache(async function () {
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
  const mappedComponents = mapAnsmComposition(
    components.filter((component) => singleComponentCis.has(component.cis)),
    names,
    [],
  );
  const denominationByCis = new Map(
    specialites.map((specialite) => [specialite.cis, specialite.denomination ?? ""]),
  );
  const seen = new Set<string>();

  return mappedComponents
    .flatMap((component) => {
      const denomination = denominationByCis.get(component.SpecId);
      return denomination === undefined
        ? []
        : [{
          SubsId: component.SubsId,
          NomId: component.NomId,
          NomLib: component.NomLib,
          SpecDenom01: denomination,
        }];
    })
    .filter((row) => {
      const key = `${row.NomId}:${row.SpecDenom01}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.NomLib.localeCompare(right.NomLib, "fr"));
});

export const getSubstanceAllSpecialites = unstable_cache(async function (
  substanceIDs: string[],
): Promise<SpecialiteWithSubstance[]> {
  if (substanceIDs.length === 0) return [];
  const substances = await resolveSubstances(substanceIDs);
  const codeToNomId = new Map(
    substances.map((substance) => [substance.SubsId, substance.NomId]),
  );
  const byCis = await componentsForCandidateCis([...codeToNomId.keys()]);
  const cisToCode = new Map<string, string>();
  for (const [cis, components] of byCis) {
    if (!hasExactlyOneComponent(components)) continue;
    const code = components.find((component) =>
      component.code_substance && codeToNomId.has(component.code_substance),
    )?.code_substance;
    if (code) cisToCode.set(cis, code);
  }
  if (cisToCode.size === 0) return [];

  const rows = await db
    .selectFrom("ansm_specialite")
    .where("cis", "in", [...cisToCode.keys()])
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .selectAll()
    .execute();
  return rows.map((row) => ({
    ...mapCatalogSpecialite(row),
    NomId: codeToNomId.get(cisToCode.get(row.cis) ?? "") ?? "",
  }));
}, ["substance-all-specialites"], { revalidate: 3600 });

export const getSubstancesResumeWithLetter = cache(async function (
  letter: string,
): Promise<ResumeSubstance[]> {
  return db
    .selectFrom("resume_substances")
    .where(({ eb, ref }) => eb(
      sql<string>`upper(${ref("NomLib")})`, "like", `${letter.toUpperCase()}%`,
    ))
    .selectAll()
    .orderBy("NomLib")
    .execute();
});

export const getSubstancesResume = cache(async function (
  substanceIDs: string[],
): Promise<ResumeSubstance[]> {
  if (substanceIDs.length === 0) return [];
  return db
    .selectFrom("resume_substances")
    .selectAll()
    .where("NomId", "in", substanceIDs)
    .orderBy("NomLib")
    .execute();
});

export async function getSubstanceDefinition(ids: string[], subsIds: string[]) {
  const rows = await db
    .selectFrom("ref_substance_active_definitions")
    .select(["nom_id", "subs_id", "sa", "definition"])
    .execute();
  let definitions = rows.filter((row) =>
    row.nom_id && ids.includes(row.nom_id.trim()),
  );
  if (definitions.length === 0) {
    definitions = rows.filter((row) =>
      row.subs_id && subsIds.includes(row.subs_id.trim()),
    );
  }
  return definitions.map((row) => ({
    NomId: row.nom_id?.trim() || "",
    SA: row.sa?.trim() || "",
    Definition: row.definition?.trim() || "",
  }));
}
