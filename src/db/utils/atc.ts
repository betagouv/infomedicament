"use server";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { pdbmMySQL } from "../pdbmMySQL";
import { ATCError } from "@/utils/atc";
import { ATC, ATC1, ATCSubsSpecs } from "@/types/ATCTypes";
import { SubstanceNom } from "../pdbmMySQL/types";
import { ResumeSpecGroup, SpecialiteWithSubstance } from "@/types/SpecialiteTypes";
import { withOneSubstance } from "./query";
import db from "@/db/";

/**
 * Returns all CIS codes for an ATC class.
 */
async function getCISCodesForAtc(atc: ATC): Promise<string[]> {
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

export const getSubstancesByAtc = cache(async (atc2: ATC): Promise<SubstanceNom[]> => {
  const CIS = await getCISCodesForAtc(atc2);

  if (!CIS.length) return [];

  return pdbmMySQL
    .selectFrom("Subs_Nom")
    .leftJoin("Composant", "Composant.NomId", "Subs_Nom.NomId")
    .innerJoin("Specialite", "Specialite.SpecId", "Composant.SpecId")
    .where("Composant.SpecId", "in", CIS)
    .where("Specialite.IsBdm", "=", 1)
    .selectAll("Subs_Nom")
    .groupBy(["Subs_Nom.NomId", "Subs_Nom.NomLib", "Subs_Nom.SubsId"])
    .orderBy("Subs_Nom.NomLib")
    .execute();
});

export const getAtc = unstable_cache(
  async function (): Promise<ATC1[]> {
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
  },
  ["atc-all"],
  { revalidate: 86400 } // 24hrs cache
);

export const getAtc1 = unstable_cache(
  async function (code: string): Promise<ATC1> {
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
  },
  ["atc1"],
  { revalidate: 86400 } // 24hrs cache
);

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

export const getAtc2 = unstable_cache(
  async function (code: string): Promise<ATC> {
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
  },
  ["atc2"],
  { revalidate: 86400 } // 24hrs cache
);

export const getResumeSpecsGroupsATCLabels = async function (specsGroups: ResumeSpecGroup[]): Promise<ResumeSpecGroup[]> {

  const rowsATC1 = await db.selectFrom("ref_atc_friendly_niveau_1")
    .select(["code", "definition_classe", "libelle"])
    .execute();

  const rowsATC2 = await db.selectFrom("ref_atc_friendly_niveau_2")
    .select(["code", "definition_sous_classe", "libelle"])
    .execute();

  return specsGroups.map((spec: ResumeSpecGroup) => {
    let atc1Label = "";
    let atc2Label = "";
    if (spec.atc1Code) {
      const atc1 = rowsATC1.find(
        (record) => record.code === spec.atc1Code
      )
      if (atc1) atc1Label = atc1.libelle as string;
    }
    if (spec.atc2Code) {
      const atc2 = rowsATC2.find(
        (record) => record.code === spec.atc2Code
      )
      if (atc2) atc2Label = atc2.libelle as string;
    }
    return {
      atc1Label: atc1Label,
      atc2Label: atc2Label,
      ...spec,
    }
  });
}

/**
 * Loads substances and specialites for all ATC2 children in a single server call.
 * Before, we were making 2 queries per ATC2 child !
 */
export async function getAtc1DefinitionData(atc1: ATC1): Promise<ATCSubsSpecs[]> {
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
      specialites: [],
    }));
  }

  // Fetch all substances with their CIS for grouping
  const substancesWithCIS = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .leftJoin("Composant", "Composant.NomId", "Subs_Nom.NomId")
    .where("Composant.SpecId", "in", uniqueCIS)
    .selectAll("Subs_Nom")
    .select("Composant.SpecId as SpecId")
    .execute();

  if (substancesWithCIS.length === 0) {
    return atc1.children.map((atc2) => ({
      atc: atc2,
      substances: [],
      specialites: [],
    }));
  }

  // Group substances by ATC2
  const atc2ToSubstances = new Map<string, SubstanceNom[]>();
  for (const [atc2Code, cisList] of atc2ToCIS) {
    const cisSet = new Set(cisList);
    const substances = substancesWithCIS
      .filter((s) => s.SpecId && cisSet.has(s.SpecId))
      .map(({ SpecId, ...sub }) => sub as SubstanceNom);

    // Deduplicate by NomId and sort
    // TODO: check if deduplicating is needed !
    const unique = substances.filter(
      (sub, i, self) => self.findIndex((s) => s.NomId === sub.NomId) === i
    );
    unique.sort((a, b) => a.NomLib.localeCompare(b.NomLib));
    atc2ToSubstances.set(atc2Code, unique);
  }

  // Fetch all specialites for all substances at once
  const allSubstanceIDs = [...new Set(substancesWithCIS.map((s) => s.NomId.trim()))];

  const allSpecialites = allSubstanceIDs.length > 0
    ? await pdbmMySQL
      .selectFrom("Specialite")
      .innerJoin("Composant", "Specialite.SpecId", "Composant.SpecId")
      .innerJoin("Subs_Nom", "Composant.NomId", "Subs_Nom.NomId")
      .where("Composant.NomId", "in", allSubstanceIDs)
      .where((eb) => withOneSubstance(eb.ref("Specialite.SpecId"), eb.ref("Subs_Nom.NomId")))
      .selectAll("Specialite")
      .select("Subs_Nom.NomId")
      .groupBy(["Specialite.SpecId", "Subs_Nom.NomId"])
      .orderBy("Subs_Nom.NomId")
      .distinct()
      .execute()
    : [];

  // Build result
  const allATC: ATCSubsSpecs[] = atc1.children.map((atc2) => {
    const substances = atc2ToSubstances.get(atc2.code) ?? [];
    const substanceIDs = new Set(substances.map((s) => s.NomId.trim()));

    return {
      atc: atc2,
      substances,
      specialites: allSpecialites.filter((sp) => substanceIDs.has(sp.NomId.trim())),
    };
  });

  return allATC;
}
