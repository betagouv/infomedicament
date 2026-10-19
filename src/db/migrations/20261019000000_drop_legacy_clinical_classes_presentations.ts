import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  // Replaced by the ANSM clinical-class, presentation and packaging tables.
  // No CASCADE: unexpected dependencies must block deletion.
  await db.schema.dropTable("vu_classes_cliniques").ifExists().execute();
  await db.schema.dropTable("classes_cliniques").ifExists().execute();
  await db.schema.dropTable("presentations").ifExists().execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Restore schemas and indexes only. Recover historical rows from a backup.
  // Table ClasseClinique from Codex
  await db.schema
    .createTable("classes_cliniques")
    .ifNotExists()
    .addColumn("codeTerme", "smallint", (col) => col.notNull().unique())
    .addColumn("libAbr", "varchar(9)")
    .addColumn("libCourt", "varchar(80)", (col) => col.notNull())
    .addColumn("libLong", "varchar(255)", (col) => col.notNull())
    .addColumn("libLongAnglais", "varchar(255)")
    .addColumn("libRech", "varchar(255)")
    .addColumn("numOrdreEdit", "smallint", (col) => col.notNull())
    .addColumn("dateCreationTerme", "date", (col) => col.notNull())
    .addColumn("dateModifTerme", "date")
    .addColumn("dateInactivTerme", "date")
    .addColumn("textSourceRef", "varchar(255)")
    .addColumn("remTerme", "varchar(255)")
    .execute();
  await db.schema
    .createIndex("classes_cliniques_idx")
    .ifNotExists()
    .on("classes_cliniques")
    .column("codeTerme")
    .unique()
    .execute();
  await db.schema
    .createIndex("classes_cliniques_libRech_idx")
    .ifNotExists()
    .on("classes_cliniques")
    .column("libRech")
    .execute();

  // Table VUClassesCliniques from Codex
  await db.schema
    .createTable("vu_classes_cliniques")
    .ifNotExists()
    .addColumn("codeVU", "varchar(8)", (col) => col.notNull())
    .addColumn("codeClasClinique", "smallint", (col) => col.notNull())
    .addColumn("indicValide", "smallint", (col) => col.notNull())
    .addColumn("remCommentaire", "varchar(150)")
    .addColumn("dateCreation", "date", (col) => col.notNull())
    .addColumn("dateDernModif", "date")
    .addColumn("codeModif", "integer")
    .execute();
  await db.schema
    .createIndex("vu_classes_cliniques_idx")
    .ifNotExists()
    .on("vu_classes_cliniques")
    .column("codeClasClinique")
    .execute();
  await db.schema
    .createIndex("vu_classes_cliniques_unique_idx")
    .ifNotExists()
    .on("vu_classes_cliniques")
    .columns(["codeVU", "codeClasClinique"])
    .unique()
    .execute();

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
    .addColumn("qtecontenance", "double precision")
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
}
