import db from "@/db";
import { buildIndications } from "@/db/utils/indicationCatalog";
import { requireNonEmpty } from "@/db/utils/refreshGuard";
import { VISIBLE_SPECIALITE_AVAILABILITIES } from "@/db/utils/specialiteCatalog";

export async function aggregatePathoClasseClinique(): Promise<void> {
  const [existing, pathologies, clinicalClasses, specialiteClasses, classPathologies, definitions] = await Promise.all([
    db.selectFrom("indications").selectAll().execute(),
    db.selectFrom("ansm_pathologie").select(["code", "nom"]).execute(),
    db
      .selectFrom("ansm_classe_clinique")
      .select(["code", "libelle_court", "libelle_long"])
      .execute(),
    db
      .selectFrom("ansm_specialite_classe_clinique")
      .innerJoin("ansm_specialite", "ansm_specialite.cis", "ansm_specialite_classe_clinique.cis")
      .where("ansm_specialite.disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .select([
        "ansm_specialite_classe_clinique.cis",
        "ansm_specialite_classe_clinique.code_classe_clinique",
      ])
      .execute(),
    db
      .selectFrom("ansm_classe_clinique_pathologie")
      .select(["code_classe_clinique", "code_pathologie"])
      .execute(),
    db
      .selectFrom("ref_pathologies")
      .select(["id", "code_patho", "code_classe_clinique", "definition"])
      .execute(),
  ]);

  requireNonEmpty("ansm_pathologie", pathologies);
  requireNonEmpty("ansm_classe_clinique", clinicalClasses);
  requireNonEmpty("visible ansm_specialite_classe_clinique relationships", specialiteClasses);
  requireNonEmpty("ansm_classe_clinique_pathologie", classPathologies);

  const nextRows = buildIndications({
    pathologies,
    clinicalClasses: clinicalClasses.map((row) => ({
      code: row.code,
      name: row.libelle_court ?? row.libelle_long ?? "",
    })),
    specialiteClasses: specialiteClasses.map((row) => ({
      cis: row.cis,
      classCode: row.code_classe_clinique,
    })),
    classPathologies: classPathologies.map((row) => ({
      classCode: row.code_classe_clinique,
      pathologyCode: row.code_pathologie,
    })),
    definitions,
  }, existing);

  requireNonEmpty("rebuilt indications", nextRows);
  if (!nextRows.some((row) => row.codePatho != null && row.CIS.length > 0)) {
    throw new Error("No pathology-backed indication has a speciality; refusing to replace indications");
  }
  if (!nextRows.some((row) => row.codePatho == null && row.CIS.length > 0)) {
    throw new Error("No clinical-class-backed indication has a speciality; refusing to replace indications");
  }

  const retainedIds = nextRows.flatMap((row) => row.id === undefined ? [] : [row.id]);
  const inserted = nextRows.filter((row) => row.id === undefined);
  const updated = nextRows.filter((row): row is typeof row & { id: number } => row.id !== undefined);

  await db.transaction().execute(async (trx) => {
    for (const row of updated) {
      const { id, ...values } = row;
      await trx.updateTable("indications").set(values).where("id", "=", id).executeTakeFirstOrThrow();
    }
    if (inserted.length > 0) {
      await trx.insertInto("indications").values(inserted.map(({ id: _id, ...row }) => row)).execute();
    }
    if (existing.length > retainedIds.length) {
      if (retainedIds.length === 0) {
        await trx.deleteFrom("indications").execute();
      } else {
        await trx.deleteFrom("indications").where("id", "not in", retainedIds).execute();
      }
    }
  });

  const finalCount = await db
    .selectFrom("indications")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirstOrThrow();
  console.log(`Indications: ${Number(finalCount.count)} total (${inserted.length} added, ${updated.length} updated, ${existing.length - retainedIds.length} removed)`);
}

aggregatePathoClasseClinique()
  .then(() => { process.exitCode = 0; })
  .catch((error) => {
    console.error("aggregatePathoClasseClinique failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
