import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("has_documents_bon_usage")
    .addColumn("code_cis", "text")
    .addColumn("auteur", "text")
    .addColumn("type_document", "text")
    .addColumn("date_mise_a_jour", "text")
    .addColumn("titre", "text")
    .addColumn("url", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("has_documents_bon_usage").execute();
}
