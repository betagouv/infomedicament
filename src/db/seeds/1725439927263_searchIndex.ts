import type { Kysely } from "kysely";
import { sql } from "kysely";
import { pdbmMySQL } from "@/db/pdbmMySQL";

export async function seed(db: Kysely<any>): Promise<void> {
  // Fetch all data from MySQL BEFORE starting the PostgreSQL transaction
  console.log("Fetching data from PDBM...");

  const substances = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .select(["Subs_Nom.NomLib", "Subs_Nom.NomId"])
    .leftJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
    .leftJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .groupBy(["Subs_Nom.NomLib", "Subs_Nom.NomId"])
    .execute();

  const specialities = await pdbmMySQL
    .selectFrom("Specialite")
    .select(["SpecDenom01", "SpecId"])
    .execute();

  const pathologies = await pdbmMySQL
    .selectFrom("Patho")
    .select(["Patho.NomPatho", "Patho.codePatho"])
    .leftJoin("Spec_Patho", "Patho.codePatho", "Spec_Patho.codePatho")
    .leftJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .groupBy(["Patho.NomPatho", "Patho.codePatho"])
    .execute();

  console.log(`Fetched ${substances.length} substances, ${specialities.length} specialities, ${pathologies.length} pathologies`);

  // Abort if we got no data from MySQL - don't truncate the existing index
  if (substances.length === 0 || specialities.length === 0 || pathologies.length === 0) {
    throw new Error("No data fetched from PDBM - aborting to preserve existing search index");
  }

  // Run everything in a transaction so TRUNCATE is rolled back if something fails
  await db.transaction().execute(async (trx) => {
    async function addIndex(table: string, id: string, token: string) {
      await trx
        .insertInto("search_index")
        .values(({ fn, val }) => ({
          token: fn("unaccent", [val(token)]),
          table_name: table,
          id,
        }))
        .execute();
    }

    // Clear the entire table at once (TRUNCATE is instant, DELETE without index is very slow)
    console.log("Truncating search_index table...");
    await sql`TRUNCATE TABLE search_index`.execute(trx);

    // Insert substances
    console.log(`Indexing ${substances.length} substances...`);
    for (const substance of substances) {
      await addIndex("Subs_Nom", substance.NomId, substance.NomLib);
    }

    // Insert specialities
    console.log(`Indexing ${specialities.length} specialities...`);
    for (const specialite of specialities) {
      await addIndex("Specialite", specialite.SpecId, specialite.SpecDenom01);
    }

    // Insert pathologies
    console.log(`Indexing ${pathologies.length} pathologies...`);
    for (const pathology of pathologies) {
      await addIndex("Patho", pathology.codePatho, pathology.NomPatho);
    }

    // Get ATC classes from PostgreSQL
    try {
      console.log("Indexing ATC classes...");
      const atc1Rows = await trx
        .selectFrom("ref_atc_friendly_niveau_1")
        .select(["code", "libelle"])
        .execute();

      const atc2Rows = await trx
        .selectFrom("ref_atc_friendly_niveau_2")
        .select(["code", "libelle"])
        .execute();

      if (atc1Rows.length === 0 && atc2Rows.length === 0) {
        throw new Error("No ATC data found in database");
      }

      console.log(`Indexing ${atc1Rows.length + atc2Rows.length} ATC classes...`);
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
    } catch (error) {
      console.warn("Failed to index ATC classes:", error);
      console.warn("Continuing without updating ATC search index.");
    }
  });

  console.log("Search index updated successfully.");
  await pdbmMySQL.destroy();
}
