import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE pipeline_run (
      id uuid PRIMARY KEY,
      trigger text NOT NULL CHECK (trigger IN ('schedule', 'manual', 'retry')),
      status text NOT NULL CHECK (status IN ('running', 'success', 'failure')),
      started_at timestamptz NOT NULL,
      finished_at timestamptz,
      failed_step text,
      error text
    )
  `.execute(db);

  await sql`
    CREATE INDEX pipeline_run_started_at_idx ON pipeline_run (started_at DESC)
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("pipeline_run").execute();
}
