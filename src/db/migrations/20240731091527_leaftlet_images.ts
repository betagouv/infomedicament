import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("leaflet_images")
    .addColumn("path", "varchar(255)", (col) => col.primaryKey())
    .addColumn("image", "bytea")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("leaflet_images").execute();
}
