import type { Kysely } from "kysely";
import { pdbmMySQL } from "@/db/pdbmMySQL";

export async function seed(db: Kysely<any>): Promise<void> {
  // Get substances from PMDB
  const substances = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .select(["NomLib", "NomId"])
    .execute();

  await db.transaction().execute(async (db) => {
    await db
      .deleteFrom("search_index")
      .where("table_name", "=", "Subs_Nom")
      .execute();

    // Insert substances into search_index
    for (const substance of substances) {
      await db
        .insertInto("search_index")
        .values(({ fn, val }) => ({
          token: fn("unaccent", [val(substance.NomLib)]),
          table_name: "Subs_Nom",
          id: substance.NomId,
        }))
        .execute();
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
      await db
        .insertInto("search_index")
        .values(({ fn, val }) => ({
          token: fn("unaccent", [val(specialite.SpecDenom01)]),
          table_name: "Specialite",
          id: specialite.SpecId,
        }))
        .execute();
    }
  });

  await pdbmMySQL.destroy();
}
