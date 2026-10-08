"use server";
import { cacheLife } from "next/cache";



import { ATCError } from "@/utils/atc";
import { ATC, ATC1, ATCLabels, ATCSubstances } from "@/types/ATCTypes";
import { ResumeSpecGroup, ResumeSpecialite } from "@/types/SpecialiteTypes";
import db from "@/db/";
import { RefAtcFriendlyNiveau1, RefAtcFriendlyNiveau2 } from "../types";
import type { Substance } from "@/types/SubstanceTypes";
import { getComposantsList } from "./composants";
import { getSubstancesResume } from "./substances";
import { VISIBLE_SPECIALITE_AVAILABILITIES } from "./specialiteCatalog";

/**
 * Returns all CIS codes for an ATC class.
 */
async function getCISCodesForAtc(atc: ATC): Promise<string[]> {
  "use cache: remote";
  cacheLife("daily");

  if (!atc.children) return [];
  const childCodes = (atc.children as ATC[]).map((child) => child.code);
  if (childCodes.length === 0) return [];

  const rows = await db
    .selectFrom("cis_atc")
    .innerJoin("atc", "atc.code_terme", "cis_atc.code_terme_atc")
    .select("cis_atc.code_cis")
    .where("atc.code", "in", childCodes)
    .execute();

  return rows.map((row) => row.code_cis).filter((cis): cis is string => cis !== null);
}

/**
 * Builds ATC children from the database.
 */
async function buildFullAtcChildren(atc2Code: string): Promise<ATC[]> {
  "use cache: remote";
  cacheLife("daily");

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
  cacheLife("daily");
  const CIS = await getCISCodesForAtc(atc2);

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
    .filter((substance, index, all) =>
      all.findIndex((candidate) => candidate.NomId === substance.NomId) === index,
    )
    .sort((left, right) => left.NomLib.localeCompare(right.NomLib, "fr"));
}

export async function getAtcMenuItems(): Promise<{ code: string; label: string }[]> {
  "use cache: remote";
  cacheLife("daily");
    const rows = await db
      .selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "libelle"])
      .execute();
    return rows.map((r) => ({ code: r.code as string, label: r.libelle as string }));
  }

export async function getAtc(): Promise<ATC1[]> {
  "use cache: remote";
  cacheLife("daily");
    const rows = await db.selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "definition_classe", "libelle"])
      .execute();

    const childrenRows = await db.selectFrom("ref_atc_friendly_niveau_2")
      .select(["code", "definition_sous_classe", "libelle"])
      .execute();

    return Promise.all(
      rows.map(async (record) => ({
        code: record.code as string,
        label: record.libelle as string,
        description: record.definition_classe as string,
        children: await Promise.all(
          childrenRows
            .filter((childRecord) =>
              (childRecord.code as string).startsWith(
                record.code as string,
              ),
            )
            .map(async (record) =>
              buildAtc2(record.code as string, childrenRows),
            ),
        ),
      })),
    );
  }

export async function getAtc1(code: string): Promise<ATC1> {
  "use cache: remote";
  cacheLife("daily");
    const rows = await db.selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "definition_classe", "libelle"])
      .execute();

    const record = rows.find(
      (record) => record.code === code.slice(0, 1),
    );
    if (!record) {
      throw new ATCError(code.slice(0, 1));
    }

    const childrenRows = await db.selectFrom("ref_atc_friendly_niveau_2")
      .select(["code", "definition_sous_classe", "libelle"])
      .execute();

    const children = await Promise.all(
      childrenRows
        .filter((record) =>
          (record.code as string).startsWith(code.slice(0, 1)),
        )
        .map(async (record) => buildAtc2(record.code as string, childrenRows)),
    );

    return {
      code: record.code as string,
      label: record.libelle as string,
      description: record.definition_classe as string,
      children,
    };
  }

/** Internal function used by getAtc and getAtc1 */
async function buildAtc2(code: string, tableNiveau2: any[]): Promise<ATC> {
  const record = tableNiveau2.find((r: any) => r.code === code.slice(0, 3));

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

export async function getAtc2(code: string): Promise<ATC> {
  "use cache: remote";
  cacheLife("daily");
    const record = await db.selectFrom("ref_atc_friendly_niveau_2")
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
  if(!rowsATC1) {
    allRowsATC1 = await getAtc1LabelRows();
  } else 
    allRowsATC1 = rowsATC1;
    
  if(!rowsATC2) {
    allRowsATC2 = await getAtc2LabelRows();
  } else
    allRowsATC2 = rowsATC2;
    
  let atc1Label = "";
  let atc2Label = "";
  if (specialite.atc1Code) {
    const atc1 = allRowsATC1.find(
      (record) => record.code === specialite.atc1Code
    )
    if (atc1) atc1Label = atc1.libelle as string;
  }
  if (specialite.atc2Code) {
    const atc2 = allRowsATC2.find(
      (record) => record.code === specialite.atc2Code
    )
    if (atc2) atc2Label = atc2.libelle as string;
  }
  return {
    atc1Label: atc1Label,
    atc2Label: atc2Label,
  }
}

export const getResumeSpecsGroupsATCLabels = async function (
  specsGroups: ResumeSpecGroup[]
): Promise<ResumeSpecGroup[]> {
  const rowsATC1 = await getAtc1LabelRows();

  const rowsATC2 = await getAtc2LabelRows();

  const specsWithATC = await Promise.all(
    specsGroups.map(async (spec: ResumeSpecGroup) => {
      const atcLabels: ATCLabels = await getSpecATCLabels(spec, rowsATC1, rowsATC2);
      return {
        atc1Label: atcLabels.atc1Label,
        atc2Label: atcLabels.atc2Label,
        ...spec,
      }
    })
  );
  return specsWithATC;
}

export const getResumeSpecsATCLabels = async function (
  specsGroups: ResumeSpecialite[]
): Promise<ResumeSpecialite[]> {
  const rowsATC1 = await getAtc1LabelRows();

  const rowsATC2 = await getAtc2LabelRows();

  const specsWithATC = await Promise.all(
    specsGroups.map(async (spec: ResumeSpecialite) => {
      const atcLabels: ATCLabels = await getSpecATCLabels(spec, rowsATC1, rowsATC2);
      return {
        atc1Label: atcLabels.atc1Label,
        atc2Label: atcLabels.atc2Label,
        ...spec,
      }
    })
  );
  return specsWithATC;
}

/**
 * Loads the destination's summary-backed substance list for each ATC2 child.
 * Composition and summary rows are fetched in bulk across the subclasses.
 */
export async function getAtc1DefinitionData(atc1: ATC1): Promise<ATCSubstances[]> {
  "use cache: remote";
  cacheLife("daily");

  // Build map of ATC2 code -> CIS codes from the database
  const atc2ToCIS = new Map<string, string[]>();
  const allCIS: string[] = [];

  for (const atc2 of atc1.children) {
    const cisCodes = await getCISCodesForAtc(atc2);
    atc2ToCIS.set(atc2.code, cisCodes);
    allCIS.push(...cisCodes);
  }

  const uniqueCIS = [...new Set(allCIS)];

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
    const cisSet = new Set(cisList);
    const substances = substancesWithCIS
      .filter((substance) => cisSet.has(substance.SpecId))
      .map(({ SubsId, NomId, NomLib }) => ({ SubsId, NomId, NomLib }));

    atc2ToSubstances.set(atc2Code, substances);
  }

  // Apply the same summary lookup as the ATC2 destination pages.
  const allSubstanceIDs = [...new Set(substancesWithCIS.map((s) => s.NomId.trim()))];

  const allResumes = await getSubstancesResume(allSubstanceIDs);

  // Build result
  const allATC: ATCSubstances[] = atc1.children.map((atc2) => {
    const substances = atc2ToSubstances.get(atc2.code) ?? [];
    const substanceIDs = new Set(substances.map((s) => s.NomId.trim()));

    return {
      atc: atc2,
      substances: allResumes.filter((substance) => substanceIDs.has(substance.NomId.trim())),
    };
  });

  return allATC;
}

async function getAtc1LabelRows() {
  "use cache: remote";
  cacheLife("daily");
  return db.selectFrom("ref_atc_friendly_niveau_1").selectAll().execute();
}

async function getAtc2LabelRows() {
  "use cache: remote";
  cacheLife("daily");
  return db.selectFrom("ref_atc_friendly_niveau_2").selectAll().execute();
}
