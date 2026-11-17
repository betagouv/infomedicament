"use server";
import "server-cli-only";

import type { ResumeSubstance, AnsmComposant } from "../types";
import db from "..";
import { sql } from "kysely";
import type { CompositionComponent, Substance } from "@/types/SubstanceTypes";
import { displaySimpleComposants } from "@/displayUtils";
import {
  compositionMatchesSubstanceSet,
  displayName,
  toCompositionComponents,
  toSubstance,
} from "./substanceCatalog";
import {
  VISIBLE_SPECIALITE_AVAILABILITIES,
} from "./specialiteCatalog";

type SubstanceSetComponent = Pick<
  AnsmComposant,
  "cis" | "numero_element" | "numero_composant" | "ordre" | "code_substance" | "nature"
>;

async function resolveSubstances(subsIds: string[]): Promise<Substance[]> {
  if (subsIds.length === 0) return [];

  // Ids are SubsIds only, never NomIds (a SubsId can also be the code_nom of another substance, e.g. 00140)
  const ansmNames = await db
    .selectFrom("ansm_substance_nom")
    .where("code_substance", "in", subsIds)
    .selectAll()
    .execute();

  const resolveFromAnsm = (id: string): Substance | undefined => {
    const canonical =
      ansmNames.find(
        (row) => row.code_substance === id && row.type === "CANONIQUE",
      ) ?? ansmNames.find((row) => row.code_substance === id);
    return canonical ? toSubstance(canonical) : undefined;
  };

  // Substances without ANSM name (e.g. estradiol anhydre 63787): name from the compositions labels, not canonical
  // (not from resume_substances: it is filled from this function, see scripts/updateResumeData.ts)
  const missingIds = [...new Set(subsIds.filter((id) => !resolveFromAnsm(id)))];
  const labels = missingIds.length > 0
    ? await db
      .selectFrom("ansm_composant")
      .where("code_substance", "in", missingIds)
      .select(["code_substance", "substance"])
      .distinct()
      .orderBy("substance")
      .execute()
    : [];

  const resolved = subsIds.flatMap((id) => {
    const substance = resolveFromAnsm(id);
    if (substance) return [substance];

    const label = labels.find((row) => row.code_substance?.trim() === id && row.substance?.trim());
    return label
      ? [{ SubsId: id, NomId: id, NomLib: displayName(label.substance!), isCanonical: false }]
      : [];
  });

  // Keep the duplicates: a substance requested twice is two components
  return resolved;
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
      "nature",
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
  "use cache: remote";

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

export async function getResumeSubstancesByNomId(subsNomsIds: string[]): Promise<ResumeSubstance[]> {
  "use cache: remote";
  const result = await db.selectFrom("resume_substances")
    .selectAll()
    .where("specialites", ">", 0)
    .where("NomId", "in", subsNomsIds)
    .orderBy("NomLib")
    .execute();
  return result ?? [];
};

export async function getAllSubsWithSpecialites() {
  "use cache: remote";
  const [components, names, specialites] = await Promise.all([
    db.selectFrom("ansm_composant")
      .selectAll()
      .execute(),
    db.selectFrom("ansm_substance_nom").selectAll().execute(),
    db
      .selectFrom("ansm_specialite")
      .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .select(["cis", "denomination"])
      .execute(),
  ]);
  const denominationByCis = new Map(
    specialites.map((specialite) => [
      specialite.cis,
      specialite.denomination ?? "",
    ]),
  );
  // All the substances of the visible CIS, alone or in association: for each component the active fractions if any,
  // otherwise the active substances (same as the substances displayed on the medicament page)
  const byCis = new Map<string, CompositionComponent[]>();
  const visibleComponents = components.filter((component) => denominationByCis.has(component.cis));
  for (const component of toCompositionComponents(visibleComponents, names, [])) {
    const rows = byCis.get(component.SpecId) ?? [];
    rows.push(component);
    byCis.set(component.SpecId, rows);
  }
  const mappedComponents = [...byCis.values()].flatMap((rows) => displaySimpleComposants(rows));
  const typeByNomId = new Map(names.map((name) => [name.code_nom.trim(), name.type]));
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
              type: typeByNomId.get(component.NomId.trim()) ?? null,
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

// Titles of the substances pages (resume_substances.title) by SubsId,
// also for the substances without specialite (e.g. only in combinations)
export async function getSubstancesTitles(subsIds: string[]): Promise<Map<string, string>> {
  "use cache: remote";
  const ids = [...new Set(subsIds.map((subsId) => subsId.trim()))];
  if (ids.length === 0) return new Map();
  const rows = await db
    .selectFrom("resume_substances")
    .select(["SubsId", "title"])
    .where(sql<string>`trim("SubsId")`, "in", ids)
    .where("title", "is not", null)
    .distinct()
    .execute();
  return new Map(rows.map((row) => [row.SubsId.trim(), row.title!.trim()]));
}

// Substances pages with at least one specialite, one row per substance with the title of its page
export async function getAllSubstancesTitles(): Promise<{ SubsId: string, title: string | null }[]> {
  "use cache: remote";
  const rows = await db
    .selectFrom("resume_substances")
    .select(["SubsId", "title"])
    .where("specialites", ">", 0)
    .distinctOn("SubsId")
    .orderBy("SubsId")
    .orderBy("title")
    .execute();
  return rows.map((row) => ({
    SubsId: row.SubsId.trim(),
    title: row.title?.trim() ?? null,
  }));
};

// Substances list of a letter: only the substances with at least one specialite
export async function getSubstancesResumeWithLetter(letter: string): Promise<ResumeSubstance[]> {
  "use cache: remote";
  return db
    .selectFrom("resume_substances")
    .where("specialites", ">", 0)
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
}

export async function getSubstanceDefinition(subsIds: string[]) {
  "use cache: remote";
  if (subsIds.length === 0) return [];
  const rows = await db.selectFrom("ref_substance_active_definitions")
    .select(["subs_id", "sa", "definition"])
    .where("subs_id", "in", subsIds)
    .orderBy("id")
    .execute();

  // A substance can have several definitions (one per name):
  // keep only the first one (lowest id) for each subsId
  const firstBySubsId = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    const subsId = row.subs_id?.trim() || "";
    if (!firstBySubsId.has(subsId)) firstBySubsId.set(subsId, row);
  }

  // Map to the expected format (matching Grist structure), in the order of subsIds
  return [...new Set(subsIds.map((subsId) => subsId.trim()))].flatMap((subsId) => {
    const row = firstBySubsId.get(subsId);
    return row
      ? [{
        SubsId: row.subs_id?.trim() || "",
        SA: row.sa?.trim() || "",
        Definition: row.definition?.trim() || "",
      }]
      : [];
  });
};

export async function getAllSubstancesResumes(): Promise<ResumeSubstance[]> {
  "use cache: remote";
  return db
    .selectFrom("resume_substances")
    .selectAll()
    .where("specialites", ">", 0)
    .orderBy("NomLib")
    .execute();
}

export async function getSubstancesNames(
  subsIds: string[]
): Promise<Substance[]> {

  "use cache: remote";
  if (subsIds.length === 0) return [];

  const rows = await db
    .selectFrom("ansm_substance_nom")
    .where("code_substance", "in", subsIds)
    .selectAll()
    .execute();
  const names: Substance[] = rows.map((row) => ({
    SubsId: row.code_substance?.trim() || "",
    NomId: row.code_nom?.trim() || "",
    NomLib: row.nom?.trim() || "",
    isCanonical: row.type === "CANONIQUE",
  }));

  // Substances without ANSM name (e.g. estradiol anhydre 63787): name from the compositions labels, not canonical
  const missingIds = [...new Set(subsIds.map((subsId) => subsId.trim()))]
    .filter((subsId) => !names.some((name) => name.SubsId === subsId));
  if (missingIds.length === 0) return names;
  const labels = await db
    .selectFrom("ansm_composant")
    .where("code_substance", "in", missingIds)
    .select(["code_substance", "substance"])
    .distinct()
    .orderBy("substance")
    .execute();
  const fallbacks = missingIds.flatMap((subsId) => {
    const label = labels.find((row) => row.code_substance?.trim() === subsId && row.substance?.trim());
    return label ? [{ SubsId: subsId, NomId: subsId, NomLib: displayName(label.substance!), isCanonical: false }] : [];
  });
  return [...names, ...fallbacks];
};
