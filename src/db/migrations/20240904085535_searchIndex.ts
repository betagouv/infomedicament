import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`.execute(db);
  await sql`CREATE EXTENSION IF NOT EXISTS unaccent`.execute(db);

  await db.schema
    .createTable("search_index")
    .addColumn("token", "text")
    .addColumn("table_name", "text")
    .addColumn("id", "text")
    .execute();

  await db.schema
    .createIndex("search_index_trgm")
    .on("search_index")
    .using("GIN (token gin_trgm_ops)")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("search_index").execute();

  await sql`DROP EXTENSION IF EXISTS unaccent`.execute(db);
  await sql`DROP EXTENSION IF EXISTS pg_trgm`.execute(db);
}
