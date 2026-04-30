import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	// Update ref_pathologies to integrate all previous fields from Grist
  await db.schema
		.alterTable('ref_pathologies')
		.dropColumn('code_patho')
		.execute();
  await db.schema
		.alterTable('ref_pathologies')
		.addColumn('code_patho', 'integer')
		.addColumn('code_classe_clinique', 'integer')
		.execute();

  // Update resume_pathologies : rename and new columns names
  await db.schema.dropTable('resume_pathologies').ifExists().execute();
  await db.schema
    .createTable("resume_indications")
    .ifNotExists()
    .addColumn("idIndication", "integer", (col) => col.notNull())
    .addColumn("nomIndication", "varchar")
    .addColumn("specialites", "integer")
    .execute();

  // Update resume_medicaments to use index instead of codePatho
  await db.schema
		.alterTable('resume_medicaments')
		.dropColumn('pathosCodes')
		.dropColumn('pathosCodesNames')
		.execute();
  await db.schema
		.alterTable('resume_medicaments')
    .addColumn('indicationsIds', sql`integer[]`)
		.addColumn('indicationsIdsNames', sql`character varying[]`)
		.execute();

  // Table ClasseClinique from Codex
  await db.schema
    .createTable('classes_cliniques')
    .ifNotExists()
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
  await db.schema.createIndex('classes_cliniques_idx').on('classes_cliniques').column('codeTerme').unique().execute();
  await db.schema.createIndex('classes_cliniques_libRech_idx').on('classes_cliniques').column('libRech').execute();

  // Table VUClassesCliniques from Codex
  await db.schema
    .createTable('vu_classes_cliniques')
    .ifNotExists()
    .addColumn('codeVU', 'varchar(8)', (col) => col.notNull())
    .addColumn('codeClasClinique', 'smallint', (col) => col.notNull())
    .addColumn('indicValide', 'smallint', (col) => col.notNull())
    .addColumn('remCommentaire', 'varchar(150)')
    .addColumn('dateCreation', 'date', (col) => col.notNull())
    .addColumn('dateDernModif', 'date')
    .addColumn('codeModif', 'integer')
    .execute();
  await db.schema.createIndex('vu_classes_cliniques_idx').ifNotExists().on('vu_classes_cliniques').column('codeClasClinique').execute();
  await db.schema.createIndex('vu_classes_cliniques_unique_idx').ifNotExists().on('vu_classes_cliniques').columns(['codeVU', 'codeClasClinique']).unique().execute();

  // Table pathologies
  await db.schema
    .createTable('indications')
    .ifNotExists()
		.addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('codePatho', 'integer')
    .addColumn('codeClasseClinique', 'integer')
    .addColumn('nom', 'varchar(255)', (col) => col.notNull())
    .addColumn('definition', 'text')
    .addColumn('CIS', sql`character varying[]`)
    .execute();

  await db
    .deleteFrom('letters')
    .where("type", "=", "pathos")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
		.alterTable('ref_pathologies')
		.dropColumn('code_patho')
		.dropColumn('code_classe_clinique')
		.execute();
  await db.schema
		.alterTable('ref_pathologies')
		.addColumn('code_patho', 'text')
		.execute();

  await db.schema.dropTable('resume_indications').ifExists().execute();
  await db.schema
    .createTable("resume_pathologies")
    .ifNotExists()
    .addColumn("codePatho", "varchar", (col) => col.notNull())
    .addColumn("NomPatho", "varchar")
    .addColumn("specialites", "integer")
    .execute();

  await db.schema
		.alterTable('resume_medicaments')
		.dropColumn('indicationsIds')
		.dropColumn('indicationsIdsNames')
		.execute();
  await db.schema
		.alterTable('resume_medicaments')
    .addColumn('pathosCodes', sql`text[]`)
		.addColumn('pathosCodesNames', sql`character varying[]`)
		.execute();

  await db.schema.dropTable('classes_cliniques').ifExists().execute();
  await db.schema.dropTable('vu_classes_cliniques').ifExists().execute();
  await db.schema.dropTable('indications').ifExists().execute();

  await db
    .deleteFrom('letters')
    .where("type", "=", "indications")
    .execute();
}

