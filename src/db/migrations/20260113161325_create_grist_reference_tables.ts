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
		.addColumn('image', 'text') // Todo: it's an image
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
		.createTable('ref_substance_active')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('subs_id', 'text')
		.addColumn('nom_id', 'text')
		.addColumn('sa', 'text')
		.addColumn('definition', 'text')
		.execute()

	// TODO: ATC classes

}

export async function down(db: Kysely<any>): Promise<void> {
	// down migration code goes here...
	// note: down migrations are optional. you can safely delete this function.
	// For more info, see: https://kysely.dev/docs/migrations
}
