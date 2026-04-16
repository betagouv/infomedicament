import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function seed(db: Kysely<any>): Promise<void> {
  console.log("Loading data for interactions_search...");

  const [substances, substMapping, medicaments, pureClassesResult] = await Promise.all([
    db
      .selectFrom("triam_groupe_substance")
      .select(["code_groupe_subst", "nom_groupe_subst"])
      .execute(),
    db
      .selectFrom("triam_subst_groupesubst")
      .select(["code_groupe_subst", "subs_id"])
      .execute(),
    db
      .selectFrom("resume_medicaments")
      .select(["groupName", "subsIds"])
      .execute(),
    sql<{ num_classe: number; nom: string }>`
      SELECT num_classe, nom FROM triam_classes
      WHERE num_classe::text NOT IN (SELECT DISTINCT code_groupe_subst FROM triam_subst_groupesubst)
    `.execute(db),
  ]);
  const pureClasses = pureClassesResult.rows;

  if (substances.length === 0) {
    throw new Error(
      "No rows in triam_groupe_substance — run the triam import first"
    );
  }

  // subs_id (BDPM) -> code_groupe_subst[] (TRIAM)
  const triamCodesBySubsId = new Map<string, string[]>();
  for (const row of substMapping) {
    const existing = triamCodesBySubsId.get(row.subs_id) ?? [];
    existing.push(row.code_groupe_subst);
    triamCodesBySubsId.set(row.subs_id, existing);
  }

  // code_groupe_subst -> substance name (for medicament labels)
  const nameByTriamCode = new Map(
    substances.map((s) => [s.code_groupe_subst, s.nom_groupe_subst])
  );

  console.log(
    `Found ${substances.length} substances, ${medicaments.length} medicaments, ${pureClasses.length} pure classes`
  );

  await db.transaction().execute(async (trx) => {
    console.log("Truncating interactions_search...");
    await sql`TRUNCATE TABLE interactions_search`.execute(trx);

    for (const s of substances) {
      await trx
        .insertInto("interactions_search")
        .values({
          label: s.nom_groupe_subst,
          type: "substance",
          subst_ids: [s.code_groupe_subst],
          class_ids: [],
        })
        .execute();
    }
    console.log(`Inserted ${substances.length} substances.`);

    for (const m of medicaments) {
      const subsIds = m.subsIds as string[];
      const triamCodes = [
        ...new Set(subsIds.flatMap((id) => triamCodesBySubsId.get(id) ?? [])),
      ];
      const substanceNames = triamCodes
        .map((code) => nameByTriamCode.get(code))
        .filter((name): name is string => name !== undefined);
      const label =
        substanceNames.length > 0
          ? `${m.groupName} (${substanceNames.join(", ")})`
          : m.groupName;
      await trx
        .insertInto("interactions_search")
        .values({ label, type: "medicament", subst_ids: triamCodes, class_ids: [] })
        .execute();
    }
    console.log(`Inserted ${medicaments.length} medicaments.`);

    for (const c of pureClasses) {
      await trx
        .insertInto("interactions_search")
        .values({
          label: c.nom,
          type: "class",
          subst_ids: [],
          class_ids: [String(c.num_classe)],
        })
        .execute();
    }
    console.log(`Inserted ${pureClasses.length} pure classes.`);
  });

  console.log("interactions_search populated successfully.");
}
