import type { Kysely } from "kysely";
import { pdbmMySQL } from "@/db/pdbmMySQL";

export async function seed(db: Kysely<any>): Promise<void> {
  async function addIndex(table: string, id: string, token: string) {
    await db
      .insertInto("search_index")
      .values(({ fn, val }) => ({
        token: fn("unaccent", [val(token)]),
        table_name: table,
        id,
      }))
      .execute();
  }

  // Get substances from PMDB
  const substances = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .select(["Subs_Nom.NomLib", "Subs_Nom.NomId"])
    .leftJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
    .leftJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .groupBy(["Subs_Nom.NomLib", "Subs_Nom.NomId"])
    .execute();

  await db.transaction().execute(async (db) => {
    await db
      .deleteFrom("search_index")
      .where("table_name", "=", "Subs_Nom")
      .execute();

    // Insert substances into search_index
    for (const substance of substances) {
      await addIndex("Subs_Nom", substance.NomId, substance.NomLib);
    }
  });

  // Get specialities from PMDB
  const specialities = await pdbmMySQL
    .selectFrom("Specialite")
    .select(["SpecDenom01", "SpecId"])
    .execute();

  await db.transaction().execute(async (db) => {
    await db
      .deleteFrom("search_index")
      .where("table_name", "=", "Specialite")
      .execute();

    // Insert specialities into search_index
    for (const specialite of specialities) {
      await addIndex("Specialite", specialite.SpecId, specialite.SpecDenom01);
    }
  });

  // Get pathologies from PMDB
  const pathologies = await pdbmMySQL
    .selectFrom("Patho")
    .select(["Patho.NomPatho", "Patho.codePatho"])
    .leftJoin("Spec_Patho", "Patho.codePatho", "Spec_Patho.codePatho")
    .leftJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .groupBy(["Patho.NomPatho", "Patho.codePatho"])
    .execute();

  await db.transaction().execute(async (db) => {
    await db
      .deleteFrom("search_index")
      .where("table_name", "=", "Patho")
      .execute();

    for (const pathology of pathologies) {
      await addIndex("Patho", pathology.codePatho, pathology.NomPatho);
    }
  });

  // Get ATC classes directly from database (not using getAtc() to avoid unstable_cache dependency)
  try {
    console.log("Indexing ATC classes...");
    const atc1Rows = await db
      .selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "libelle"])
      .execute();

    const atc2Rows = await db
      .selectFrom("ref_atc_friendly_niveau_2")
      .select(["code", "libelle"])
      .execute();

    if (atc1Rows.length === 0 && atc2Rows.length === 0) {
      throw new Error("No ATC data found in database");
    }

    await db.transaction().execute(async (db) => {
      await db
        .deleteFrom("search_index")
        .where("table_name", "=", "ATC")
        .execute();

      for (const atcClass of atc1Rows) {
        if (atcClass.code && atcClass.libelle) {
          await addIndex("ATC", atcClass.code, atcClass.libelle);
        }
      }
      for (const atcSubClass of atc2Rows) {
        if (atcSubClass.code && atcSubClass.libelle) {
          await addIndex("ATC", atcSubClass.code, atcSubClass.libelle);
        }
      }
    });
  } catch (error) {
    console.warn("Failed to index ATC classes:", error);
    console.warn("Continuing without updating ATC search index.");
  }


  await pdbmMySQL.destroy();
}
