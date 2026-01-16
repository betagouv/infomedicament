import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	// up migration code goes here...
	// note: up migrations are mandatory. you must implement this function.
	// For more info, see: https://kysely.dev/docs/migrations
	await db.schema
		.createTable('ref_glossaire')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('nom', 'text')
		.addColumn('definition', 'text')
		.addColumn('source', 'text')
		.addColumn('a_souligner', 'boolean')
		.execute()

	await db.schema
		.createTable('ref_articles')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('titre', 'text')
		.addColumn('source', 'text')
		.addColumn('contenu', 'text')
		.addColumn('theme', 'text')
		.addColumn('lien', 'text')
		.addColumn('metadescription', 'text') // empty in grist
		.addColumn('homepage', 'boolean')
		.addColumn('image', 'text') // Todo: it's an image, could we store it in the codebase ?
		.addColumn('atc_classe', 'text')
		.addColumn('substances', 'text')
		.addColumn('specialites', 'text')
		.addColumn('pathologies', 'text')
		.execute()

	await db.schema
		.createTable('ref_marr_url_cis')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('url', 'text')
		.addColumn('cis', 'text')
		.execute()

	await db.schema
		.createTable('ref_marr_url_pdf')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('url', 'text') // Ref to ref_marr_url_cis
		.addColumn('nom_document', 'text')
		.addColumn('url_document', 'text')
		.addColumn('type', 'text')
		.execute()

	await db.schema
		.createTable('ref_pathologies')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('code_patho', 'text')
		.addColumn('definition', 'text')
		.execute()

	await db.schema
		.createTable('ref_pediatrie')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('cis', 'text')
		.addColumn('indication', 'text')
		.addColumn('contre_indication', 'text')
		.addColumn('avis', 'text')
		.addColumn('mention', 'text')
		.execute()

	await db.schema
		.createTable('ref_grossesse_substances_contre_indiquees')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('subs_id', 'text')
		.addColumn('lien_site_ansm', 'text')
		.execute()

	await db.schema
		.createTable('ref_grossesse_mention')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('cis', 'text') // TODO: add as a boolean in an existing table ?
		.execute()

	await db.schema
		.createTable('ref_substance_active_definitions')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('subs_id', 'text')
		.addColumn('nom_id', 'text')
		.addColumn('sa', 'text')
		.addColumn('definition', 'text') // c'est ça qui nous intéresse
		.execute()

	await db.schema
		.createTable('ref_atc_friendly_niveau_1')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('code', 'text')
		.addColumn('libelle', 'text')
		.addColumn('definition_classe', 'text')
		.execute()

	await db.schema
		.createTable('ref_atc_friendly_niveau_2')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('code', 'text')
		.addColumn('libelle', 'text')
		.addColumn('definition_sous_classe', 'text')
		.execute()

	await db.schema
		.createTable('atc')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('code', 'text')
		.addColumn('label', 'text')
		.execute()

	await db.schema
		.createTable('cis_atc')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('code_cis', 'text')
		.addColumn('code_atc', 'text')
		.addColumn('label_atc', 'text')
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	// down migration code goes here...
	// note: down migrations are optional. you can safely delete this function.
	// For more info, see: https://kysely.dev/docs/migrations
	await db.schema.dropTable('ref_substance_active_definitions').execute()
	await db.schema.dropTable('ref_grossesse_mention').execute()
	await db.schema.dropTable('ref_grossesse_substances_contre_indiquees').execute()
	await db.schema.dropTable('ref_pediatrie').execute()
	await db.schema.dropTable('ref_pathologies').execute()
	await db.schema.dropTable('ref_marr_url_pdf').execute()
	await db.schema.dropTable('ref_marr_url_cis').execute()
	await db.schema.dropTable('ref_articles').execute()
	await db.schema.dropTable('ref_glossaire').execute()
	await db.schema.dropTable('ref_atc_friendly_niveau_1').execute()
	await db.schema.dropTable('ref_atc_friendly_niveau_2').execute()
	await db.schema.dropTable('cis_atc').execute()
	await db.schema.dropTable('atc').execute()
}
