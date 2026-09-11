import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createIndex("ansm_composant_code_substance_idx")
    .ifNotExists()
    .on("ansm_composant")
    .column("code_substance")
    .execute();
  await db.schema
    .createIndex("ansm_substance_nom_code_nom_idx")
    .ifNotExists()
    .on("ansm_substance_nom")
    .column("code_nom")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropIndex("ansm_substance_nom_code_nom_idx").ifExists().execute();
  await db.schema.dropIndex("ansm_composant_code_substance_idx").ifExists().execute();
}
