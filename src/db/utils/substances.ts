"use server";
import "server-cli-only";

import { SubstanceNom } from "../pdbmMySQL/types";
import { cache } from "react";
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

async function resolveSubstances(subsIds: string[]): Promise<Substance[]> {
  if (subsIds.length === 0) return [];

  const [ansmNames, resumeFallbacks] = await Promise.all([
    db
      .selectFrom("ansm_substance_nom")
      .where((eb) =>
        eb.or([eb("code_nom", "in", subsIds), eb("code_substance", "in", subsIds)]),
      )
      .selectAll()
      .execute(),
    db
      .selectFrom("resume_substances")
      .where((eb) => eb.or([eb("NomId", "in", subsIds), eb("SubsId", "in", subsIds)]))
      .select(["SubsId", "NomId", "NomLib"])
      .execute(),
  ]);

  const resolved = subsIds.flatMap((id) => {
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
  subsIds: string[],
): Promise<Map<string, SubstanceSetComponent[]>> {
  if (subsIds.length === 0) return new Map();

  const targetRows = await db
    .selectFrom("ansm_composant")
    .where("code_substance", "in", subsIds)
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

  const subsIds = substances.map((substance) => substance.SubsId);
  const byCis = await componentsForCandidateCis(subsIds);
  return [...byCis.entries()]
    .filter(([, components]) =>
      compositionMatchesSubstanceSet(components, subsIds),
    )
    .map(([cis]) => cis);
}

export const getResumeSubstances = cache(async function (
  subsIds: string[]
): Promise<SubstanceNom[] | undefined> {
  return db.selectFrom("resume_substances")
    .selectAll()
    .where("SubsId", "in", subsIds)
    .orderBy("NomLib")
    .execute();
});

export const getAllSubsWithSpecialites = cache(async function () {
  const [components, names, specialites] = await Promise.all([
    db.selectFrom("ansm_composant")
      .selectAll()
      .where("nature", "=", "Substance active")
      .execute(),
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
});

export const getSubstancesResumeWithLetter = cache(async function (
  letter: string,
): Promise<ResumeSubstance[]> {
  return db
    .selectFrom("resume_substances")
    .where(({ eb, ref }) =>
      eb(
        sql<string>`unaccent(upper(${ref("NomLib")}))`,
        "like",
        sql<string>`unaccent(${`${letter.toUpperCase()}%`})`,
      ),
    )
    .selectAll()
    .orderBy("NomLib")
    .execute();
});

export const getSubstancesResume = cache(async function (
  subsIDs: string[],
): Promise<ResumeSubstance[]> {
  if (subsIDs.length === 0) return [];
  return db
    .selectFrom("resume_substances")
    .selectAll()
    .where("SubsId", "in", subsIDs)
    .orderBy("NomLib")
    .execute();
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
