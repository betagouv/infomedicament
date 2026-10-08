import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("ansm_specialite")
    .addColumn("code_ema", "varchar")
    .addColumn("een", "varchar")
    .execute();

  await db.schema
    .createTable("ansm_excipient_effet_notoire")
    .ifNotExists()
    .addColumn("code", "integer", (col) => col.notNull().primaryKey())
    .addColumn("libelle", "varchar")
    .execute();

  await db.schema
    .createTable("ansm_specialite_excipient_effet_notoire")
    .ifNotExists()
    .addColumn("cis", "varchar", (col) => col.notNull())
    .addColumn("code_excipient", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint(
      "ansm_specialite_excipient_effet_notoire_pkey",
      ["cis", "code_excipient"],
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("ansm_specialite_excipient_effet_notoire")
    .ifExists()
    .execute();
  await db.schema
    .dropTable("ansm_excipient_effet_notoire")
    .ifExists()
    .execute();
  await db.schema
    .alterTable("ansm_specialite")
    .dropColumn("code_ema")
    .dropColumn("een")
    .execute();
}
