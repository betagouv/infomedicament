import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // triam_gtiam — interaction severity levels
  await db.schema
    .createTable("triam_gtiam")
    .addColumn("num_groupe", "integer", (col) => col.notNull())
    .addColumn("groupe", sql`varchar(15)`, (col) => col.notNull().primaryKey())
    .addColumn("date_groupe", "date", (col) => col.notNull())
    .execute();

  // triam_classes — pharmacological classes
  await db.schema
    .createTable("triam_classes")
    .addColumn("num_classe", "integer", (col) => col.notNull())
    .addColumn("nom", sql`varchar(255)`, (col) => col.notNull().primaryKey())
    .addColumn("chapeau", "text")
    .addColumn("rem_comment", sql`varchar(255)`)
    .addColumn("dat_creation", "date")
    .addColumn("dat_modif", "date")
    .addColumn("dat_histo", "date")
    .execute();

  // triam_groupe_substance — substance groups
  await db.schema
    .createTable("triam_groupe_substance")
    .addColumn("code_groupe_subst", "integer", (col) => col.notNull().primaryKey())
    .addColumn("code_groupe_pere", "integer")
    .addColumn("nom_groupe_subst", sql`varchar(255)`, (col) => col.notNull())
    .addColumn("rem_groupe_subst", sql`varchar(255)`)
    .addColumn("date_creation", "date")
    .addColumn("date_dern_modif", "date")
    .execute();

  // triam_interactions — main interaction data
  await db.schema
    .createTable("triam_interactions")
    .addColumn("num", "integer", (col) => col.notNull().primaryKey())
    .addColumn("code_groupe_subst1", "integer", (col) => col.notNull())
    .addColumn("code_groupe_subst2", "integer", (col) => col.notNull())
    .addColumn("classe", "integer")
    .addColumn("classe1", "integer")
    .addColumn("num_inter_clas", "integer")
    .addColumn("code", sql`varchar(4)`)
    .addColumn("niveau", sql`varchar(20)`)
    .addColumn("groupe", sql`varchar(15)`)
    .addColumn("voie", "integer", (col) => col.notNull())
    .addColumn("historique", "boolean", (col) => col.notNull())
    .addColumn("risque", "text")
    .addColumn("conduite", "text")
    .addColumn("commentaire", "text")
    .addColumn("livret", "integer")
    .addColumn("dat_creation", "date", (col) => col.notNull())
    .addColumn("dat_modif", "date")
    .addColumn("dat_histo", "date")
    .execute();

  await db.schema
    .createIndex("triam_interactions_code_groupe_subst1_idx")
    .on("triam_interactions")
    .column("code_groupe_subst1")
    .execute();

  await db.schema
    .createIndex("triam_interactions_code_groupe_subst2_idx")
    .on("triam_interactions")
    .column("code_groupe_subst2")
    .execute();

  // interactions_search — denormalized search cache for autocomplete
  await db.schema
    .createTable("interactions_search")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("subst_ids", sql`text[]`, (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("interactions_search_trgm")
    .on("interactions_search")
    .using("GIN (label gin_trgm_ops)")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("interactions_search").execute();
  await db.schema.dropTable("triam_interactions").execute();
  await db.schema.dropTable("triam_groupe_substance").execute();
  await db.schema.dropTable("triam_classes").execute();
  await db.schema.dropTable("triam_gtiam").execute();
}
