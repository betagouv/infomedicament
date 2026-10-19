import type { Kysely } from "kysely";

// Deploy the dataeng ANSM ATC readers before applying this migration.
export async function up(db: Kysely<any>): Promise<void> {
  // No CASCADE: unexpected dependencies must block deletion.
  await db.schema.dropTable("cis_atc").ifExists().execute();
  await db.schema.dropTable("atc").ifExists().execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore the preceding schema only. Historical rows require a backup.
  await db.schema
    .createTable("atc")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("code", "text")
    .addColumn("code_terme", "text", (col) => col.unique())
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
  await db.schema
    .createIndex("atc_code_idx")
    .on("atc")
    .column("code")
    .execute();
  await db.schema
    .createIndex("atc_code_terme_pere_idx")
    .on("atc")
    .column("code_terme_pere")
    .execute();

  await db.schema
    .createTable("cis_atc")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("code_cis", "text")
    .addColumn("code_terme_atc", "text")
    .addColumn("est_valide", "boolean", (col) => col.defaultTo(false))
    .addColumn("est_certain", "boolean", (col) => col.defaultTo(false))
    .addColumn("commentaire", "text")
    .addColumn("date_creation", "timestamp")
    .addColumn("date_modification", "timestamp")
    .addColumn("code_modif", "integer")
    .execute();
  await db.schema
    .createIndex("cis_atc_code_cis_idx")
    .on("cis_atc")
    .column("code_cis")
    .execute();
  await db.schema
    .createIndex("cis_atc_code_terme_atc_idx")
    .on("cis_atc")
    .column("code_terme_atc")
    .execute();
}
