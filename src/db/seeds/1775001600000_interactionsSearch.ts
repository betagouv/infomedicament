import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function seed(db: Kysely<any>): Promise<void> {
  console.log("Loading data for interactions_search...");

  const substances = await db
    .selectFrom("triam_groupe_substance")
    .select(["code_groupe_subst", "nom_groupe_subst"])
    .execute();

  // TODO: add médicaments once we have a reliable link between resume_medicaments.subsIds
  // (BDPM substance IDs, range 0-99997) and triam_groupe_substance.code_groupe_subst
  // (TRIAM IDs, range 100624+). The two ID systems have no overlap — the only bridge
  // is by name (e.g. "abacavir base" vs "abacavir"), which requires fuzzy matching
  // or a manual mapping table.
  //
  // const medicaments = await db
  //   .selectFrom("resume_medicaments")
  //   .select(["groupName", "subsIds"])
  //   .execute();
  //
  // Build a map of code_groupe_subst (as text) to nom_groupe_subst.
  // Gotcha: only covers substances in triam — médicaments whose subsIds reference
  // an unknown substance will silently omit that name from the label.
  // const substanceNameByCode = new Map(
  //   substances.map((s) => [String(s.code_groupe_subst), s.nom_groupe_subst])
  // );
  //
  // for (const m of medicaments) {
  //   const subsIds = m.subsIds as string[];
  //   const substanceNames = subsIds
  //     .map((id) => substanceNameByCode.get(id.trim()))
  //     .filter((name): name is string => name !== undefined);
  //   const label =
  //     substanceNames.length > 0
  //       ? `${m.groupName} (${substanceNames.join(", ")})`
  //       : m.groupName;
  //   await trx
  //     .insertInto("interactions_search")
  //     .values({ label, type: "medicament", subst_ids: subsIds })
  //     .execute();
  // }

  if (substances.length === 0) {
    throw new Error(
      "No rows in triam_groupe_substance — run the triam import first"
    );
  }

  console.log(`Found ${substances.length} substances`);

  await db.transaction().execute(async (trx) => {
    console.log("Truncating interactions_search...");
    await sql`TRUNCATE TABLE interactions_search`.execute(trx);

    for (const s of substances) {
      await trx
        .insertInto("interactions_search")
        .values({
          label: s.nom_groupe_subst,
          type: "substance",
          // code_groupe_subst is an integer PK in triam_groupe_substance,
          // cast to text to match the text[] type of subst_ids
          subst_ids: [String(s.code_groupe_subst)],
        })
        .execute();
    }

    console.log(`Inserted ${substances.length} substances.`);
  });

  console.log("interactions_search populated successfully.");
}
