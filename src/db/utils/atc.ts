"use server";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { ATCError } from "@/utils/atc";
import { ATC, ATC1, ATCLabels, ATCSubsSpecs } from "@/types/ATCTypes";
import { SubstanceNom } from "../pdbmMySQL/types";
import { ResumeSpecGroup, ResumeSpecialite } from "@/types/SpecialiteTypes";
import db from "@/db/";
import { RefAtcFriendlyNiveau1, RefAtcFriendlyNiveau2 } from "../types";

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

  const composantRows = await db
    .selectFrom("ansm_composant")
    .where("cis", "in", CIS)
    .select("code_substance")
    .distinct()
    .execute();

  const subsIds = composantRows
    .map((r) => r.code_substance)
    .filter((id): id is string => id !== null);

  if (subsIds.length === 0) return [];

  return db
    .selectFrom("resume_substances")
    .where("SubsId", "in", subsIds)
    .selectAll()
    .orderBy("NomLib")
    .execute() as unknown as SubstanceNom[];
});

export const getAtcMenuItems = unstable_cache(
  async function (): Promise<{ code: string; label: string }[]> {
    const rows = await db
      .selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "libelle"])
      .execute();
    return rows.map((r) => ({ code: r.code as string, label: r.libelle as string }));
  },
  ["atc-menu"],
  { revalidate: 86400 },
);

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
export const getSpecATCLabels = async function (
  specialite: ResumeSpecGroup | ResumeSpecialite,
  rowsATC1?: RefAtcFriendlyNiveau1[],
  rowsATC2?: RefAtcFriendlyNiveau2[],
): Promise<ATCLabels> {
  let allRowsATC1: RefAtcFriendlyNiveau1[] = [];
  let allRowsATC2: RefAtcFriendlyNiveau2[] = [];
  if(!rowsATC1) {
    allRowsATC1 = await db.selectFrom("ref_atc_friendly_niveau_1")
      .selectAll()
      .execute();
  } else 
    allRowsATC1 = rowsATC1;
    
  if(!rowsATC2) {
    allRowsATC2 = await db.selectFrom("ref_atc_friendly_niveau_2")
      .selectAll()
      .execute();
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
  const rowsATC1 = await db.selectFrom("ref_atc_friendly_niveau_1")
    .selectAll()
    .execute();

  const rowsATC2 = await db.selectFrom("ref_atc_friendly_niveau_2")
    .selectAll()
    .execute();

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
  const rowsATC1 = await db.selectFrom("ref_atc_friendly_niveau_1")
    .selectAll()
    .execute();

  const rowsATC2 = await db.selectFrom("ref_atc_friendly_niveau_2")
    .selectAll()
    .execute();

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

export async function getAtc1DefinitionData(atc1: ATC1): Promise<ATCSubsSpecs[]> {
  const atc2ToCIS = new Map<string, string[]>();
  const allCIS: string[] = [];

  for (const atc2 of atc1.children) {
    const cisCodes = await getCISCodesForAtc(atc2);
    atc2ToCIS.set(atc2.code, cisCodes);
    allCIS.push(...cisCodes);
  }

  const uniqueCIS = [...new Set(allCIS)];

  if (uniqueCIS.length === 0) {
    return atc1.children.map((atc2) => ({ atc: atc2, substances: [], specialites: [] }));
  }

  // Substances for each CIS via ansm_composant → resume_substances
  const composantRows = await db
    .selectFrom("ansm_composant")
    .innerJoin("resume_substances", "resume_substances.SubsId", "ansm_composant.code_substance")
    .where("ansm_composant.cis", "in", uniqueCIS)
    .selectAll("resume_substances")
    .select("ansm_composant.cis as cis")
    .execute();

  if (composantRows.length === 0) {
    return atc1.children.map((atc2) => ({ atc: atc2, substances: [], specialites: [] }));
  }

  // Group substances by ATC2
  const atc2ToSubstances = new Map<string, SubstanceNom[]>();
  for (const [atc2Code, cisList] of atc2ToCIS) {
    const cisSet = new Set(cisList);
    const substances = composantRows
      .filter((r) => cisSet.has(r.cis))
      .map(({ cis: _cis, ...sub }) => sub as unknown as SubstanceNom);

    const unique = substances.filter(
      (sub, i, self) => self.findIndex((s) => s.NomId === sub.NomId) === i
    );
    unique.sort((a, b) => a.NomLib.localeCompare(b.NomLib));
    atc2ToSubstances.set(atc2Code, unique);
  }

  // Specialites: single-active-substance drugs only
  const allSubsIds = [...new Set(composantRows.map((r) => r.SubsId))];

  const activeSubRows = await db
    .selectFrom("ansm_composant")
    .where("code_substance", "is not", null)
    .select(["cis", "code_substance"])
    .distinct()
    .execute();

  const cisSubCounts = new Map<string, number>();
  for (const row of activeSubRows) {
    cisSubCounts.set(row.cis, (cisSubCounts.get(row.cis) ?? 0) + 1);
  }
  const singleSubCIS = new Set(
    [...cisSubCounts.entries()].filter(([, n]) => n === 1).map(([cis]) => cis)
  );

  const allSpecialites = allSubsIds.length > 0
    ? await db
      .selectFrom("ansm_composant")
      .innerJoin("ansm_specialite", "ansm_specialite.cis", "ansm_composant.cis")
      .where("ansm_composant.code_substance", "in", allSubsIds)
      .where("ansm_specialite.disponibilite", "!=", "INDISPONIBLE")
      .where("ansm_composant.cis", "in", [...singleSubCIS])
      .selectAll("ansm_specialite")
      .select("ansm_composant.code_substance as SubsId")
      .distinct()
      .execute()
    : [];

  // Map SubsId → NomId for ATCSubsSpecs.specialites
  const subsIdToNomId = new Map(composantRows.map((r) => [r.SubsId, r.NomId]));
  const specialitesWithNomId = allSpecialites.map((sp) => ({
    ...sp,
    NomId: subsIdToNomId.get(sp.SubsId ?? "") ?? "",
  }));

  return atc1.children.map((atc2) => {
    const substances = atc2ToSubstances.get(atc2.code) ?? [];
    const substanceIDs = new Set(substances.map((s) => s.NomId.trim()));

    return {
      atc: atc2,
      substances,
      specialites: specialitesWithNomId.filter((sp) => substanceIDs.has(sp.NomId.trim())),
    };
  });
}
