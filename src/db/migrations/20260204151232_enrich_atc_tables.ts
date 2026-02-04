import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Enrich atc table with Codex columns
  await db.schema
    .alterTable("atc")
    .dropColumn("label")
    .addColumn("code_terme", "text", (col) => col.unique()) // colonne pour la jointure avec cis_atc.code_terme_atc
    .addColumn("code_terme_pere", "text")
    .addColumn("label_court", "text")
    .addColumn("label_long", "text")
    .addColumn("label_anglais", "text")
    .addColumn("label_recherche", "text")
    .addColumn("num_ordre_edit", "integer")
    .addColumn("date_creation", "timestamp")
    .addColumn("date_modification", "timestamp")
    .addColumn("date_inactivation", "timestamp")
    .addColumn("source_ref", "text")
    .addColumn("remarque", "text")
    .execute();

  // Create indexes for atc
  await db.schema.createIndex("atc_code_idx").on("atc").column("code").execute();
  await db.schema.createIndex("atc_code_terme_pere_idx").on("atc").column("code_terme_pere").execute();

  // Enrich cis_atc table with Codex columns, and drop columns that don't exist
  await db.schema
    .alterTable("cis_atc")
    .dropColumn("code_atc")
    .dropColumn("label_atc")
    .addColumn("code_terme_atc", "text") // colonne pour la jointure avec atc.code_terme
    .addColumn("est_valide", "boolean", (col) => col.defaultTo(false))
    .addColumn("est_certain", "boolean", (col) => col.defaultTo(false))
    .addColumn("commentaire", "text")
    .addColumn("date_creation", "timestamp")
    .addColumn("date_modification", "timestamp")
    .addColumn("code_modif", "integer")
    .execute();

  // Create indexes for cis_atc
  await db.schema.createIndex("cis_atc_code_cis_idx").on("cis_atc").column("code_cis").execute();
  await db.schema.createIndex("cis_atc_code_terme_atc_idx").on("cis_atc").column("code_terme_atc").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop indexes
  await db.schema.dropIndex("cis_atc_code_terme_atc_idx").execute();
  await db.schema.dropIndex("cis_atc_code_cis_idx").execute();
  await db.schema.dropIndex("atc_code_terme_pere_idx").execute();
  await db.schema.dropIndex("atc_code_idx").execute();

  // Remove columns from cis_atc
  await db.schema
    .alterTable("cis_atc")
    .addColumn("code_atc", "text")
    .addColumn("label_atc", "text")
    .dropColumn("code_modif")
    .dropColumn("date_modification")
    .dropColumn("date_creation")
    .dropColumn("commentaire")
    .dropColumn("est_certain")
    .dropColumn("est_valide")
    .dropColumn("code_terme_atc")
    .execute();

  // Remove columns from atc, and recreate the label column
  await db.schema
    .alterTable("atc")
    .addColumn("label", "text")
    .dropColumn("remarque")
    .dropColumn("source_ref")
    .dropColumn("date_inactivation")
    .dropColumn("date_modification")
    .dropColumn("date_creation")
    .dropColumn("num_ordre_edit")
    .dropColumn("label_recherche")
    .dropColumn("label_anglais")
    .dropColumn("label_long")
    .dropColumn("label_court")
    .dropColumn("code_terme_pere")
    .dropColumn("code_terme")
    .execute();
}
