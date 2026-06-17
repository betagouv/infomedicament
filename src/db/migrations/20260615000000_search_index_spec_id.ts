import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Add spec_id so name tokens can be attributed to a specific spécialité.
  // Nullable: substance/atc/indication tokens are group-level and leave it NULL.
  await db.schema
    .alterTable("search_index")
    .addColumn("spec_id", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("search_index")
    .dropColumn("spec_id")
    .execute();
}
