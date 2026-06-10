import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function seed(db: Kysely<any>): Promise<void> {
  console.log("Loading data for interactions_search...");

  const [substances, substMapping, medicaments, pureClasses] = await Promise.all([
    db
      .selectFrom("ansm_groupe_substance")
      .select(["code_groupe", "nom"])
      .execute(),
    db
      .selectFrom("ansm_substance_groupe_substance")
      .select(["code_groupe", "code_substance"])
      .execute(),
    db
      .selectFrom("resume_medicaments")
      .select(["groupName", "subsIds"])
      .execute(),
    // Pure classes: pharmacological classes that have no corresponding substance group.
    // (Substance groups are those with entries in ansm_substance_groupe_substance.)
    db
      .selectFrom("ansm_classe_interaction")
      .select(["code_classe", "nom"])
      .where(
        "code_classe",
        "not in",
        db.selectFrom("ansm_substance_groupe_substance").select("code_groupe").distinct(),
      )
      .execute(),
  ]);

  if (substances.length === 0) {
    throw new Error(
      "No rows in ansm_groupe_substance — run the bdpm import first"
    );
  }

  // code_substance (BDPM) -> code_groupe[] (ansm_substance_groupe_substance)
  const groupsBySubstance = new Map<string, number[]>();
  for (const row of substMapping) {
    const existing = groupsBySubstance.get(row.code_substance) ?? [];
    existing.push(row.code_groupe);
    groupsBySubstance.set(row.code_substance, existing);
  }

  // code_groupe -> substance name (for medicament labels)
  const nameByGroupCode = new Map(
    substances.map((s) => [s.code_groupe, s.nom])
  );

  console.log(
    `Found ${substances.length} substance groups, ${medicaments.length} medicaments, ${pureClasses.length} pure classes`
  );

  await db.transaction().execute(async (trx) => {
    console.log("Truncating interactions_search...");
    await sql`TRUNCATE TABLE interactions_search`.execute(trx);

    for (const s of substances) {
      await trx
        .insertInto("interactions_search")
        .values({
          label: s.nom ?? '',
          type: "substance",
          subst_ids: [String(s.code_groupe)],
          class_ids: [],
        })
        .execute();
    }
    console.log(`Inserted ${substances.length} substance groups.`);

    for (const m of medicaments) {
      const subsIds = m.subsIds as string[];
      const groupCodes = [
        ...new Set(subsIds.flatMap((id) => groupsBySubstance.get(id) ?? [])),
      ];
      const substanceNames = groupCodes
        .map((code) => nameByGroupCode.get(code))
        .filter((name): name is string => name !== undefined && name !== null);
      const label =
        substanceNames.length > 0
          ? `${m.groupName} (${substanceNames.join(", ")})`
          : m.groupName;
      await trx
        .insertInto("interactions_search")
        .values({ label, type: "medicament", subst_ids: groupCodes.map(String), class_ids: [] })
        .execute();
    }
    console.log(`Inserted ${medicaments.length} medicaments.`);

    for (const c of pureClasses) {
      await trx
        .insertInto("interactions_search")
        .values({
          label: c.nom ?? '',
          type: "class",
          subst_ids: [],
          class_ids: [String(c.code_classe)],
        })
        .execute();
    }
    console.log(`Inserted ${pureClasses.length} pure classes.`);
  });

  console.log("interactions_search populated successfully.");
}
