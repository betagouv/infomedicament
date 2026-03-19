import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('asmr')
		.ifNotExists()
		.addColumn('code_evamed', 'text')
		.addColumn('motif_demande', 'text')
		.addColumn('code_cis', 'text')
		.addColumn('code_cip', 'text')
		.addColumn('denomination_specialite', 'text')
		.addColumn('date_avis_definitif', 'text')
		.addColumn('asmr', 'text')
		.addColumn('valeur_asmr', 'text')
		.addColumn('libelle_asmr', 'text')
		.execute();

	await db.schema
		.createTable('smr')
		.ifNotExists()
		.addColumn('code_evamed', 'text')
		.addColumn('motif_demande', 'text')
		.addColumn('code_cis', 'text')
		.addColumn('code_cip', 'text')
		.addColumn('denomination', 'text')
		.addColumn('date_avis_definitif', 'text')
		.addColumn('smr', 'text')
		.addColumn('valeur_smr', 'text')
		.addColumn('libelle_smr', 'text')
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('asmr').ifExists().execute();
	await db.schema.dropTable('smr').ifExists().execute();
}
