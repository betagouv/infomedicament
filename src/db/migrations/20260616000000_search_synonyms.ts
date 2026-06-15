import { type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Hand-curated lay-term → medical-term mappings (e.g. "mal de tête" → "céphalées").
  // Loaded at query time to expand searches against the existing trigram search_index.
  // `alias` is stored normalized (lowercase, unaccented); `canonical` keeps its accented
  // form for display and is normalized at query time when used as a search term.
  await db.schema
    .createTable("search_synonyms")
    .ifNotExists()
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("alias", "text", (col) => col.notNull())
    .addColumn("canonical", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("search_synonyms_alias_idx")
    .ifNotExists()
    .on("search_synonyms")
    .column("alias")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("search_synonyms").ifExists().execute();
}
