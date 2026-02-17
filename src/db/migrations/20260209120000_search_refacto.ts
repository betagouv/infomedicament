import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add full ATC code to resume_medicaments
  await db.schema
    .alterTable("resume_medicaments")
    .addColumn("atc5Code", "text")
    .execute();

  // Redesign search_index: drop old table and recreate with new schema
  await db.schema.dropTable("search_index").execute();

  await db.schema
    .createTable("search_index")
    .addColumn("token", "text")
    .addColumn("match_type", "text")
    .addColumn("group_name", "text")
    .addColumn("match_label", "text")
    .execute();

  await db.schema
    .createIndex("search_index_trgm")
    .on("search_index")
    .using("GIN (token gin_trgm_ops)")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore old search_index schema
  await db.schema.dropTable("search_index").execute();

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

  // Remove atc5Code column
  await db.schema
    .alterTable("resume_medicaments")
    .dropColumn("atc5Code")
    .execute();
}
