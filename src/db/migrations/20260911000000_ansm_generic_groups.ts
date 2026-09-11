import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("ansm_groupe_generique")
    .ifNotExists()
    .addColumn("code_groupe", "integer", (col) => col.notNull().primaryKey())
    .addColumn("libelle", "varchar")
    .addColumn("code_atc", "integer")
    .addColumn("date_modification", "timestamptz")
    .addColumn("commentaire", "text")
    .execute();

  await db.schema
    .createIndex("ansm_groupe_generique_code_atc_idx")
    .on("ansm_groupe_generique")
    .column("code_atc")
    .execute();

  await db.schema
    .createTable("ansm_specialite_groupe_generique")
    .ifNotExists()
    .addColumn("code_groupe", "integer", (col) => col.notNull())
    .addColumn("cis", "varchar", (col) => col.notNull())
    .addColumn("role", "varchar")
    .addColumn("rang", "integer")
    .addPrimaryKeyConstraint("ansm_specialite_groupe_generique_pkey", [
      "code_groupe",
      "cis",
    ])
    .execute();

  await db.schema
    .createIndex("ansm_specialite_groupe_generique_cis_idx")
    .on("ansm_specialite_groupe_generique")
    .column("cis")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("ansm_specialite_groupe_generique")
    .ifExists()
    .execute();
  await db.schema.dropTable("ansm_groupe_generique").ifExists().execute();
}
