import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	//Update ref_pathologies to integrate all previous fields from Grist
  await db.schema
		.alterTable('ref_pathologies')
		.dropColumn('code_patho')
		.execute();
  await db.schema
		.alterTable('ref_pathologies')
		.addColumn('code_patho', 'integer')
		.execute();
	await db.schema
		.alterTable('ref_pathologies')
		.addColumn('isClasseClinique', 'boolean', (col) => col.defaultTo(false))
		.execute();

  // Table ClasseClinique from Codex
  await db.schema
    .createTable('classes_cliniques')
    .addColumn('codeTerme', 'smallint', (col) => col.notNull().unique())
    .addColumn('libAbr', 'varchar(9)')
    .addColumn('libCourt', 'varchar(80)', (col) => col.notNull())
    .addColumn('libLong', 'varchar(255)', (col) => col.notNull())
    .addColumn('libLongAnglais', 'varchar(255)')
    .addColumn('libRech', 'varchar(255)')
    .addColumn('numOrdreEdit', 'smallint', (col) => col.notNull())
    .addColumn('dateCreationTerme', 'date', (col) => col.notNull())
    .addColumn('dateModifTerme', 'date')
    .addColumn('dateInactivTerme', 'date')
    .addColumn('textSourceRef', 'varchar(255)')
    .addColumn('remTerme', 'varchar(255)')
    .execute();

  await db.schema.createIndex("classes_cliniques_idx").on("classes_cliniques").column("codeTerme").unique().execute();
  await db.schema.createIndex("classes_cliniques_libRech_idx").on("classes_cliniques").column("libRech").execute();

  // Table VUClassesCliniques from Codex
  await db.schema
    .createTable('vu_classes_cliniques')
    .addColumn('codeVU', 'varchar(8)', (col) => col.notNull())
    .addColumn('codeClasClinique', 'smallint', (col) => col.notNull())
    .addColumn('indicValide', 'smallint', (col) => col.notNull())
    .addColumn('remCommentaire', 'varchar(150)')
    .addColumn('dateCreation', 'date', (col) => col.notNull())
    .addColumn('dateDernModif', 'date')
    .addColumn('codeModif', 'integer')
    .execute();

  await db.schema.createIndex("vu_classes_cliniques_idx").on("vu_classes_cliniques").column("codeClasClinique").execute();
  await db.schema.createIndex("vu_classes_cliniques_unique_idx").on("vu_classes_cliniques").columns(["codeVU", "codeClasClinique"]).unique().execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
		.alterTable('ref_pathologies')
		.dropColumn('code_patho')
		.execute();
  await db.schema
		.alterTable('ref_pathologies')
		.addColumn('code_patho', 'text')
		.execute();
	await db.schema
		.alterTable('ref_pathologies')
		.dropColumn('isClasseClinique')
		.execute();

  await db.schema.dropIndex("classes_cliniques_idx").execute();
  await db.schema.dropIndex("classes_cliniques_libRech_idx").execute();
  await db.schema.dropTable('classes_cliniques').execute();

  await db.schema.dropIndex("vu_classes_cliniques_idx").execute();
  await db.schema.dropIndex("vu_classes_cliniques_unique_idx").execute();
  await db.schema.dropTable('vu_classes_cliniques').execute();
}

