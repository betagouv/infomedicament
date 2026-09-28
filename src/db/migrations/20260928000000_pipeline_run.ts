import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("pipeline_run")
    .ifNotExists()
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("trigger", "text", (col) => col.notNull()) // schedule, manual, retry
    .addColumn("status", "text", (col) => col.notNull()) // running, success, failure
    .addColumn("started_at", "timestamptz", (col) => col.notNull())
    .addColumn("finished_at", "timestamptz")
    .addColumn("failed_step", "text")
    .addColumn("error", "text")
    .execute();

  await db.schema
    .createIndex("pipeline_run_started_at_idx")
    .on("pipeline_run")
    .column("started_at desc")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("pipeline_run").execute();
}
