import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("notices").dropColumn("children").execute();
  await db.schema.alterTable("rcp").dropColumn("children").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore the columns only; their previous contents cannot be recovered.
  await db.schema
    .alterTable("rcp")
    .addColumn("children", sql`bigint[]`)
    .execute();
  await db.schema
    .alterTable("notices")
    .addColumn("children", sql`bigint[]`)
    .execute();
}
