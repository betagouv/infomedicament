import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("pipeline_run")
    .addColumn("semantic_report", "jsonb", (col) => col.ifNotExists())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("pipeline_run")
    .dropColumn("semantic_report")
    .execute();
}
