"use server";

import { ATCError } from "@/utils/atc";
import { ATC, ATC1, ATCLabels, ATCSubstances } from "@/types/ATCTypes";
import { ResumeSpecGroup, ResumeSpecialite } from "@/types/SpecialiteTypes";
import db from "@/db/";
import { RefAtcFriendlyNiveau1, RefAtcFriendlyNiveau2 } from "../types";
import type { Substance } from "@/types/SubstanceTypes";
import { getComposantsList } from "./composants";
import { getSubstancesResume } from "./substances";
import { VISIBLE_SPECIALITE_AVAILABILITIES } from "./specialiteCatalog";

/** Fetch exact descendant memberships once across all requested ATC classes. */
async function getCISCodesForAtcs(
  atcs: ATC[],
): Promise<Map<string, Set<string>>> {
  const parentsByChildCode = new Map<string, Set<string>>();
  const cisByParent = new Map<string, Set<string>>();
  for (const atc of atcs) {
    cisByParent.set(atc.code, new Set());
    for (const child of atc.children ?? []) {
      const parents = parentsByChildCode.get(child.code) ?? new Set<string>();
      parents.add(atc.code);
      parentsByChildCode.set(child.code, parents);
    }
  }
  const childCodes = [...parentsByChildCode.keys()];
  if (childCodes.length === 0) return cisByParent;

  const rows = await db
    .selectFrom("cis_atc")
    .innerJoin("atc", "atc.code_terme", "cis_atc.code_terme_atc")
    .select(["cis_atc.code_cis", "atc.code as atc_code"])
    .where("atc.code", "in", childCodes)
    .execute();

  for (const row of rows) {
    if (row.code_cis === null || row.atc_code === null) continue;
    for (const parent of parentsByChildCode.get(row.atc_code) ?? []) {
      cisByParent.get(parent)!.add(row.code_cis);
    }
  }
  return cisByParent;
}

/**
 * Builds ATC children from the database.
 */
async function buildFullAtcChildren(atc2Code: string): Promise<ATC[]> {
  const rows = await db
    .selectFrom("atc")
    .select(["code", "label_court"])
    .where("code", "like", `${atc2Code}%`)
    .execute();

  return rows.map((row) => ({
    code: row.code ?? "",
    label: row.label_court ?? "",
    description: "",
  }));
}

export async function getSubstancesByAtc(atc2: ATC): Promise<Substance[]> {
  "use cache: remote";
  const cisByParent = await getCISCodesForAtcs([atc2]);
  const CIS = [...(cisByParent.get(atc2.code) ?? [])];

  if (!CIS.length) return [];

  const visibleRows = await db
    .selectFrom("ansm_specialite")
    .where("cis", "in", CIS)
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .select("cis")
    .execute();
  const components = await getComposantsList(visibleRows.map((row) => row.cis));

  return components
    .map(({ SubsId, NomId, NomLib }) => ({ SubsId, NomId, NomLib }))
    .filter(
      (substance, index, all) =>
        all.findIndex((candidate) => candidate.NomId === substance.NomId) ===
        index,
    )
    .sort((left, right) => left.NomLib.localeCompare(right.NomLib, "fr"));
}

export async function getAtcMenuItems(): Promise<
  { code: string; label: string }[]
> {
  "use cache: remote";
  const rows = await db
    .selectFrom("ref_atc_friendly_niveau_1")
    .select(["code", "libelle"])
    .execute();
  return rows.map((r) => ({
    code: r.code as string,
    label: r.libelle as string,
  }));
}

type AtcDescendantRow = { code: string | null; label_court: string | null };

function groupAtcDescendants(rows: AtcDescendantRow[]): Map<string, ATC[]> {
  const bySubclass = new Map<string, ATC[]>();
  for (const row of rows) {
    if (row.code === null) continue;
    const subclass = row.code.slice(0, 3);
    const children = bySubclass.get(subclass) ?? [];
    children.push({
      code: row.code,
      label: row.label_court ?? "",
      description: "",
    });
    bySubclass.set(subclass, children);
  }
  return bySubclass;
}

function buildAtc2(
  record: Pick<
    RefAtcFriendlyNiveau2,
    "code" | "libelle" | "definition_sous_classe"
  >,
  descendants: Map<string, ATC[]>,
): ATC {
  return {
    code: record.code as string,
    label: record.libelle as string,
    description: record.definition_sous_classe as string,
    children: descendants.get(record.code as string) ?? [],
  };
}

export async function getAtc(): Promise<ATC1[]> {
  "use cache: remote";
  const [rows, childrenRows, descendantRows] = await Promise.all([
    db
      .selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "definition_classe", "libelle"])
      .execute(),
    db
      .selectFrom("ref_atc_friendly_niveau_2")
      .select(["code", "definition_sous_classe", "libelle"])
      .execute(),
    db.selectFrom("atc").select(["code", "label_court"]).execute(),
  ]);
  const descendants = groupAtcDescendants(descendantRows);

  return rows.map((record) => ({
    code: record.code as string,
    label: record.libelle as string,
    description: record.definition_classe as string,
    children: childrenRows
      .filter((child) =>
        (child.code as string).startsWith(record.code as string),
      )
      .map((child) => buildAtc2(child, descendants)),
  }));
}

export async function getAtc1(code: string): Promise<ATC1> {
  "use cache: remote";
  const parentCode = code.slice(0, 1);
  const [record, childrenRows, descendantRows] = await Promise.all([
    db
      .selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "definition_classe", "libelle"])
      .where("code", "=", parentCode)
      .executeTakeFirst(),
    db
      .selectFrom("ref_atc_friendly_niveau_2")
      .select(["code", "definition_sous_classe", "libelle"])
      .where("code", "like", `${parentCode}%`)
      .execute(),
    db
      .selectFrom("atc")
      .select(["code", "label_court"])
      .where("code", "like", `${parentCode}%`)
      .execute(),
  ]);
  if (!record) throw new ATCError(parentCode);
  const descendants = groupAtcDescendants(descendantRows);

  return {
    code: record.code as string,
    label: record.libelle as string,
    description: record.definition_classe as string,
    children: childrenRows.map((child) => buildAtc2(child, descendants)),
  };
}

export async function getAtc2(code: string): Promise<ATC> {
  "use cache: remote";
  const record = await db
    .selectFrom("ref_atc_friendly_niveau_2")
    .select(["code", "libelle", "definition_sous_classe"])
    .where("code", "=", code.slice(0, 3))
    .executeTakeFirst();

  if (!record) {
    throw new ATCError(code.slice(0, 3));
  }

  return {
    code: record.code as string,
    label: record.libelle as string,
    description: record.definition_sous_classe as string,
    children: await buildFullAtcChildren(code),
  };
}
export const getSpecATCLabels = async function (
  specialite: ResumeSpecGroup | ResumeSpecialite,
  rowsATC1?: RefAtcFriendlyNiveau1[],
  rowsATC2?: RefAtcFriendlyNiveau2[],
): Promise<ATCLabels> {
  let allRowsATC1: RefAtcFriendlyNiveau1[] = [];
  let allRowsATC2: RefAtcFriendlyNiveau2[] = [];
  if (!rowsATC1) {
    allRowsATC1 = await getAtc1LabelRows();
  } else allRowsATC1 = rowsATC1;

  if (!rowsATC2) {
    allRowsATC2 = await getAtc2LabelRows();
  } else allRowsATC2 = rowsATC2;

  let atc1Label = "";
  let atc2Label = "";
  if (specialite.atc1Code) {
    const atc1 = allRowsATC1.find(
      (record) => record.code === specialite.atc1Code,
    );
    if (atc1) atc1Label = atc1.libelle as string;
  }
  if (specialite.atc2Code) {
    const atc2 = allRowsATC2.find(
      (record) => record.code === specialite.atc2Code,
    );
    if (atc2) atc2Label = atc2.libelle as string;
  }
  return {
    atc1Label: atc1Label,
    atc2Label: atc2Label,
  };
};

export const getResumeSpecsGroupsATCLabels = async function (
  specsGroups: ResumeSpecGroup[],
): Promise<ResumeSpecGroup[]> {
  const rowsATC1 = await getAtc1LabelRows();

  const rowsATC2 = await getAtc2LabelRows();

  const specsWithATC = await Promise.all(
    specsGroups.map(async (spec: ResumeSpecGroup) => {
      const atcLabels: ATCLabels = await getSpecATCLabels(
        spec,
        rowsATC1,
        rowsATC2,
      );
      return {
        atc1Label: atcLabels.atc1Label,
        atc2Label: atcLabels.atc2Label,
        ...spec,
      };
    }),
  );
  return specsWithATC;
};

export const getResumeSpecsATCLabels = async function (
  specsGroups: ResumeSpecialite[],
): Promise<ResumeSpecialite[]> {
  const rowsATC1 = await getAtc1LabelRows();

  const rowsATC2 = await getAtc2LabelRows();

  const specsWithATC = await Promise.all(
    specsGroups.map(async (spec: ResumeSpecialite) => {
      const atcLabels: ATCLabels = await getSpecATCLabels(
        spec,
        rowsATC1,
        rowsATC2,
      );
      return {
        atc1Label: atcLabels.atc1Label,
        atc2Label: atcLabels.atc2Label,
        ...spec,
      };
    }),
  );
  return specsWithATC;
};

/**
 * Loads the destination's summary-backed substance list for each ATC2 child.
 * CIS memberships, composition and summary rows are fetched in bulk across subclasses.
 */
export async function getAtc1DefinitionData(
  atc1: ATC1,
): Promise<ATCSubstances[]> {
  "use cache: remote";
  const atc2ToCIS = await getCISCodesForAtcs(atc1.children);
  const uniqueCIS = [
    ...new Set([...atc2ToCIS.values()].flatMap((codes) => [...codes])),
  ];

  // Early return if no medications found
  if (uniqueCIS.length === 0) {
    return atc1.children.map((atc2) => ({
      atc: atc2,
      substances: [],
    }));
  }

  const visibleSpecialities = await db
    .selectFrom("ansm_specialite")
    .where("cis", "in", uniqueCIS)
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .select("cis")
    .execute();
  const substancesWithCIS = await getComposantsList(
    visibleSpecialities.map((row) => row.cis),
  );

  if (substancesWithCIS.length === 0) {
    return atc1.children.map((atc2) => ({
      atc: atc2,
      substances: [],
    }));
  }

  // Group substances by ATC2
  const atc2ToSubstances = new Map<string, Substance[]>();
  for (const [atc2Code, cisList] of atc2ToCIS) {
    const substances = substancesWithCIS
      .filter((substance) => cisList.has(substance.SpecId))
      .map(({ SubsId, NomId, NomLib }) => ({ SubsId, NomId, NomLib }));

    atc2ToSubstances.set(atc2Code, substances);
  }

  // Apply the same summary lookup as the ATC2 destination pages.
  const allSubstanceIDs = [
    ...new Set(substancesWithCIS.map((s) => s.NomId.trim())),
  ];

  const allResumes = await getSubstancesResume(allSubstanceIDs);

  // Build result
  const allATC: ATCSubstances[] = atc1.children.map((atc2) => {
    const substances = atc2ToSubstances.get(atc2.code) ?? [];
    const substanceIDs = new Set(substances.map((s) => s.NomId.trim()));

    return {
      atc: atc2,
      substances: allResumes.filter((substance) =>
        substanceIDs.has(substance.NomId.trim()),
      ),
    };
  });

  return allATC;
}

async function getAtc1LabelRows() {
  "use cache: remote";
  return db.selectFrom("ref_atc_friendly_niveau_1").selectAll().execute();
}

async function getAtc2LabelRows() {
  "use cache: remote";
  return db.selectFrom("ref_atc_friendly_niveau_2").selectAll().execute();
}
