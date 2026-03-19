import { Kysely, sql } from "kysely";

/**
 * Catch-up migration ("better late than never").
 *
 * These tables existed before the project was managed by Kysely migrations.
 * All creates use ifNotExists(): this migration is a no-op on existing databases,
 * and correctly creates the schema on fresh ones.
 *
 * Schema verified against pg_dump on 2026-03-10.
 */
export async function up(db: Kysely<any>): Promise<void> {
  // --- Presentations (supplementary PDBM data, exact origin to be documented) ---
  // No primary key — codecip13 has a btree index but is not unique (multiple rows per CIP13).
  await db.schema
    .createTable("presentations")
    .ifNotExists()
    .addColumn("numpresentation", "integer")
    .addColumn("codecip13", "text")
    .addColumn("nom_presentation", "text")
    .addColumn("numelement", "integer")
    .addColumn("nomelement", "text")
    .addColumn("recipient", "text")
    .addColumn("numrecipient", "integer")
    .addColumn("nbrrecipient", "integer")
    .addColumn("qtecontenance", "integer")
    .addColumn("codeunitecontenance", "text")
    .addColumn("unitecontenance", "text")
    .addColumn("codecaraccomplrecip", "text")
    .addColumn("numordreedit", "integer")
    .addColumn("caraccomplrecip", "text")
    .addColumn("numdispositif", "integer")
    .addColumn("codenaturedispositif", "text")
    .addColumn("dispositif", "text")
    .execute();

  await db.schema
    .createIndex("presentations_codecip13_index")
    .ifNotExists()
    .on("presentations")
    .column("codecip13")
    .execute();

  // --- RCP (Résumés des Caractéristiques du Produit) ---
  await db.schema
    .createTable("rcp")
    .ifNotExists()
    .addColumn("codeCIS", "bigint", (col) => col.primaryKey())
    .addColumn("title", "varchar")
    .addColumn("dateNotif", "varchar")
    .addColumn("children", sql`bigint[]`) // ids → rcp_content
    .execute();

  await db.schema
    .createTable("rcp_content")
    .ifNotExists()
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("type", "varchar")
    .addColumn("styles", sql`character varying[]`)
    .addColumn("anchor", "varchar")
    .addColumn("content", sql`character varying[]`)
    .addColumn("children", sql`bigint[]`) // ids → rcp_content (self-referential)
    .addColumn("tag", "varchar")
    .addColumn("rowspan", "integer")
    .addColumn("colspan", "integer")
    .addColumn("html", "varchar")
    .execute();

  // --- Patient notices ---
  await db.schema
    .createTable("notices")
    .ifNotExists()
    .addColumn("codeCIS", "bigint", (col) => col.primaryKey())
    .addColumn("title", "varchar")
    .addColumn("dateNotif", "varchar")
    .addColumn("children", sql`bigint[]`) // ids → notices_content
    .execute();

  await db.schema
    .createTable("notices_content")
    .ifNotExists()
    .addColumn("id", "bigserial", (col) => col.primaryKey())
    .addColumn("type", "varchar")
    .addColumn("styles", sql`character varying[]`)
    .addColumn("anchor", "varchar")
    .addColumn("content", sql`character varying[]`)
    .addColumn("children", sql`bigint[]`) // ids → notices_content (self-referential)
    .addColumn("tag", "varchar")
    .addColumn("rowspan", "integer")
    .addColumn("colspan", "integer")
    .addColumn("html", "varchar")
    .execute();

  // --- User feedback ---
  // Note: not found in pg_dump — may not exist yet in the live DB.
  await db.schema
    .createTable("rating")
    .ifNotExists()
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("pageId", "text", (col) => col.notNull())
    .addColumn("rating", "integer")
    .addColumn("question1", "integer")
    .addColumn("question2", "integer")
    .execute();

  // --- Summary tables (denormalized from MySQL via scripts/updateResumeData.ts) ---
  await db.schema
    .createTable("resume_pathologies")
    .ifNotExists()
    .addColumn("codePatho", "varchar", (col) => col.notNull())
    .addColumn("NomPatho", "varchar")
    .addColumn("specialites", "integer")
    .execute();

  await db.schema
    .createTable("resume_substances")
    .ifNotExists()
    .addColumn("SubsId", "varchar")
    .addColumn("NomId", "varchar")
    .addColumn("NomLib", "varchar")
    .addColumn("specialites", "integer", (col) => col.defaultTo(0))
    .execute();

  // Note: the atc5Code column is added by migration 20260217120000_search_refacto
  await db.schema
    .createTable("resume_medicaments")
    .ifNotExists()
    .addColumn("groupName", "varchar")
    .addColumn("composants", "varchar")
    .addColumn("specialites", sql`character varying[]`) // string[][] stored as varchar[]
    .addColumn("atc1Code", "varchar")
    .addColumn("atc2Code", "varchar")
    .addColumn("pathosCodes", sql`text[]`)
    .addColumn("CISList", sql`text[]`)
    .addColumn("subsIds", sql`text[]`)
    .execute();

  await db.schema
    .createTable("resume_generiques")
    .ifNotExists()
    .addColumn("SpecId", "varchar")
    .addColumn("SpecName", "varchar")
    .execute();

  // --- Alphabetic navigation ---
  await db.schema
    .createTable("letters")
    .ifNotExists()
    .addColumn("type", "varchar", (col) => col.notNull()) // pathos | substances | specialites | generiques
    .addColumn("letters", sql`character varying[]`, (col) => col.notNull())
    .execute();

  // --- ref_substance_active ---
  // Present in types.d.ts but not populated by syncWithGrist.ts.
  // Possibly an orphaned table — investigate before removing.
  await db.schema
    .createTable("ref_substance_active")
    .ifNotExists()
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("subs_id", "text")
    .addColumn("nom_id", "text")
    .addColumn("sa", "text")
    .addColumn("definition", "text")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("ref_substance_active").ifExists().execute();
  await db.schema.dropTable("letters").ifExists().execute();
  await db.schema.dropTable("resume_generiques").ifExists().execute();
  await db.schema.dropTable("resume_medicaments").ifExists().execute();
  await db.schema.dropTable("resume_substances").ifExists().execute();
  await db.schema.dropTable("resume_pathologies").ifExists().execute();
  await db.schema.dropTable("rating").ifExists().execute();
  await db.schema.dropTable("notices_content").ifExists().execute();
  await db.schema.dropTable("notices").ifExists().execute();
  await db.schema.dropTable("rcp_content").ifExists().execute();
  await db.schema.dropTable("rcp").ifExists().execute();
  await db.schema.dropTable("presentations").ifExists().execute();
}
