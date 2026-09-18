import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("notices_content").execute();
  await db.schema.dropTable("rcp_content").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("rcp_content")
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("type", "varchar")
    .addColumn("styles", sql`character varying[]`)
    .addColumn("anchor", "varchar")
    .addColumn("content", sql`character varying[]`)
    .addColumn("children", sql`bigint[]`)
    .addColumn("tag", "varchar")
    .addColumn("rowspan", "integer")
    .addColumn("colspan", "integer")
    .addColumn("html", "varchar")
    .execute();

  await db.schema
    .createTable("notices_content")
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("type", "varchar")
    .addColumn("styles", sql`character varying[]`)
    .addColumn("anchor", "varchar")
    .addColumn("content", sql`character varying[]`)
    .addColumn("children", sql`bigint[]`)
    .addColumn("tag", "varchar")
    .addColumn("rowspan", "integer")
    .addColumn("colspan", "integer")
    .addColumn("html", "varchar")
    .execute();
}
