import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function seed(db: Kysely<any>): Promise<void> {
  // Load all reference data from PostgreSQL into memory for fast lookups
  console.log("Loading reference data from PostgreSQL...");

  // NB: you must run updateResumeData.ts in order for those tables to be
  // up-to-date when recieving a new BDPM mysql dump. 
  const groups = await db
    .selectFrom("resume_medicaments")
    .selectAll()
    .execute();

  const substances = await db
    .selectFrom("resume_substances")
    .select(["NomId", "NomLib"])
    .execute();

  const pathologies = await db
    .selectFrom("resume_pathologies")
    .select(["codePatho", "NomPatho"])
    .execute();

  const atcRows = await db
    .selectFrom("atc")
    .select(["code", "label_court"])
    .where("code", "is not", null)
    .where("label_court", "is not", null)
    .execute();

  const atcFriendly1 = await db
    .selectFrom("ref_atc_friendly_niveau_1")
    .select(["code", "libelle"])
    .execute();

  const atcFriendly2 = await db
    .selectFrom("ref_atc_friendly_niveau_2")
    .select(["code", "libelle"])
    .execute();

  console.log(
    `Loaded ${groups.length} groups, ${substances.length} substances, ` +
    `${pathologies.length} pathologies, ${atcRows.length} ATC codes, ` +
    `${atcFriendly1.length + atcFriendly2.length} friendly ATC labels`
  );

  if (groups.length === 0 || substances.length === 0) {
    throw new Error("No groups found in resume_medicaments or in resume_substances — run updateResumeData first");
  }

  // Build lookup maps
  const substanceMap = new Map(substances.map((s) => [s.NomId.trim(), s.NomLib]));
  const pathologyMap = new Map(pathologies.map((p) => [p.codePatho.trim(), p.NomPatho]));

  // Build ATC label map: code → labels (may have both friendly and technical labels)
  const atcLabelMap = new Map<string, Set<string>>();
  for (const row of atcRows) {
    if (row.code && row.label_court) {
      if (!atcLabelMap.has(row.code)) atcLabelMap.set(row.code, new Set());
      atcLabelMap.get(row.code)!.add(row.label_court);
    }
  }
  for (const row of atcFriendly1) {
    if (row.code && row.libelle) {
      if (!atcLabelMap.has(row.code)) atcLabelMap.set(row.code, new Set());
      atcLabelMap.get(row.code)!.add(row.libelle as string);
    }
  }
  for (const row of atcFriendly2) {
    if (row.code && row.libelle) {
      if (!atcLabelMap.has(row.code)) atcLabelMap.set(row.code, new Set());
      atcLabelMap.get(row.code)!.add(row.libelle as string);
    }
  }

  // Run in a transaction
  await db.transaction().execute(async (trx) => {
    console.log("Truncating search_index table...");
    await sql`TRUNCATE TABLE search_index`.execute(trx);

    let totalRows = 0;

    async function addIndex(
      matchType: string,
      groupName: string,
      token: string,
      matchLabel: string,
    ) {
      await trx
        .insertInto("search_index")
        .values(({ fn, val }) => ({
          token: fn("unaccent", [val(token)]),
          match_type: matchType,
          group_name: groupName,
          match_label: matchLabel,
        }))
        .execute();
      totalRows++;
    }

    for (const group of groups) {
      const gn = group.groupName;

      // 1. Index specialité names and CIS codes
      const specialites: string[][] = group.specialites as string[][];
      for (const spec of specialites) {
        const ciscode = spec[0]; // SpecId
        const specName = spec[1]; // SpecDenom01
        if (specName) {
          await addIndex("name", gn, specName, specName);
        }
        if (ciscode) {
          await addIndex("name", gn, ciscode, ciscode);
        }
      }

      // 2. Index substance names
      const subsIds: string[] = (group.subsIds as string[]) ?? [];
      for (const subsId of subsIds) {
        const nomLib = substanceMap.get(subsId.trim());
        if (nomLib) {
          await addIndex("substance", gn, nomLib, nomLib);
        }
      }

      // 3. Index pathology names
      const pathosCodes: string[] = (group.pathosCodes as string[]) ?? [];
      for (const code of pathosCodes) {
        const nomPatho = pathologyMap.get(code.trim());
        if (nomPatho) {
          await addIndex("pathology", gn, nomPatho, nomPatho);
        }
      }

      // 4. Index ATC labels and codes at all ancestor levels
      const atc5Code: string | null = group.atc5Code as string | null;
      if (atc5Code) {
        // Standard ATC levels: 1 (A), 3 (A10), 4 (A10B), 5 (A10BA), 7 (A10BA02)
        const atcLevels = [1, 3, 4, 5, 7];
        const prefixes = new Set<string>();
        for (const len of atcLevels) {
          if (len <= atc5Code.length) prefixes.add(atc5Code.slice(0, len));
        }
        for (const prefix of prefixes) {
          // Index the ATC code itself (e.g., "N05BA01") so professionals can search by code
          await addIndex("atc", gn, prefix, prefix);
          // Index ATC labels for this code
          const labels = atcLabelMap.get(prefix);
          if (labels) {
            for (const label of labels) {
              await addIndex("atc", gn, label, label);
            }
          }
        }
      }
    }

    console.log(`Indexed ${totalRows} rows for ${groups.length} groups.`);
  });

  console.log("Search index updated successfully.");
}
