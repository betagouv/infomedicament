import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("ansm_presentation")
    .addColumn("date_arret_commercialisation", "date")
    .addColumn("statut", "varchar")
    .execute();

  await sql`
    ALTER TABLE ansm_specialite
      ALTER COLUMN generique TYPE integer
        USING NULLIF(generique, '')::integer,
      ALTER COLUMN procedure TYPE varchar
        USING procedure::text
  `.execute(db);

  await db.schema
    .createTable("ansm_presentation_evenement")
    .ifNotExists()
    .addColumn("cip", "varchar", (col) => col.notNull())
    .addColumn("code_evenement", "integer", (col) => col.notNull())
    .addColumn("num_evenement", "integer", (col) => col.notNull())
    .addColumn("evenement", "varchar")
    .addColumn("date_evenement", "date")
    .addColumn("date_echeance", "date")
    .addColumn("commentaire", "text")
    .addColumn("date_modification", "timestamptz")
    .addPrimaryKeyConstraint("ansm_presentation_evenement_pkey", [
      "cip",
      "code_evenement",
      "num_evenement",
    ])
    .execute();

  await db.schema
    .createTable("ansm_pathologie")
    .ifNotExists()
    .addColumn("code", "integer", (col) => col.notNull())
    .addColumn("nom", "varchar", (col) => col.notNull())
    .addColumn("code_parent", "integer")
    .addColumn("information", "text")
    .addPrimaryKeyConstraint("ansm_pathologie_pkey", ["code", "nom"])
    .execute();

  await db.schema
    .createTable("ansm_classe_clinique_pathologie")
    .ifNotExists()
    .addColumn("code_classe_clinique", "integer", (col) => col.notNull())
    .addColumn("code_pathologie", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint("ansm_classe_clinique_pathologie_pkey", [
      "code_classe_clinique",
      "code_pathologie",
    ])
    .execute();

  await db.schema
    .createTable("ansm_delivrance")
    .ifNotExists()
    .addColumn("code", "integer", (col) => col.notNull().primaryKey())
    .addColumn("libelle_court", "varchar")
    .addColumn("libelle_long", "varchar")
    .execute();

  await db.schema
    .createTable("ansm_specialite_delivrance")
    .ifNotExists()
    .addColumn("cis", "varchar", (col) => col.notNull())
    .addColumn("code_delivrance", "integer", (col) => col.notNull())
    .addPrimaryKeyConstraint("ansm_specialite_delivrance_pkey", [
      "cis",
      "code_delivrance",
    ])
    .execute();

  await db.schema
    .createTable("ansm_specialite_evenement")
    .ifNotExists()
    .addColumn("cis", "varchar", (col) => col.notNull())
    .addColumn("code_evenement", "integer", (col) => col.notNull())
    .addColumn("num_evenement", "integer", (col) => col.notNull())
    .addColumn("evenement", "varchar")
    .addColumn("date_evenement", "date")
    .addColumn("date_echeance", "date")
    .addColumn("commentaire", "text")
    .addColumn("date_modification", "timestamptz")
    .addPrimaryKeyConstraint("ansm_specialite_evenement_pkey", [
      "cis",
      "code_evenement",
      "num_evenement",
    ])
    .execute();

  await db.schema
    .createTable("ansm_substance_nom")
    .ifNotExists()
    .addColumn("code_substance", "varchar", (col) => col.notNull())
    .addColumn("code_nom", "varchar", (col) => col.notNull())
    .addColumn("nom", "varchar")
    .addColumn("type", "varchar")
    .addPrimaryKeyConstraint("ansm_substance_nom_pkey", [
      "code_substance",
      "code_nom",
    ])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("ansm_presentation_evenement").execute();
  await db.schema.dropTable("ansm_classe_clinique_pathologie").execute();
  await db.schema.dropTable("ansm_specialite_delivrance").execute();
  await db.schema.dropTable("ansm_specialite_evenement").execute();
  await db.schema.dropTable("ansm_substance_nom").execute();
  await db.schema.dropTable("ansm_delivrance").execute();
  await db.schema.dropTable("ansm_pathologie").execute();

  await db.schema
    .alterTable("ansm_presentation")
    .dropColumn("date_arret_commercialisation")
    .dropColumn("statut")
    .execute();

  // Package procedure values are textual enums, so rolling them back to the old
  // integer type necessarily nulls values that cannot be represented as integers.
  await sql`
    ALTER TABLE ansm_specialite
      ALTER COLUMN generique TYPE varchar
        USING generique::text,
      ALTER COLUMN procedure TYPE integer
        USING CASE
          WHEN procedure ~ '^-?[0-9]+$' THEN procedure::integer
          ELSE NULL
        END
  `.execute(db);
}
