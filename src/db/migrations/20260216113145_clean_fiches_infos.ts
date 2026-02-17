import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	//Remove useless tables for fiches infos
	await db.schema.dropTable('fiches_infos').ifExists().execute();
	await db.schema.dropTable('groupes_generiques').ifExists().execute();
	await db.schema.dropTable('documents_bon_usage').ifExists().execute();
	await db.schema.dropTable('composants').ifExists().execute();
	await db.schema.dropTable('elements').ifExists().execute();
	await db.schema.dropTable('smr').ifExists().execute();
	await db.schema.dropTable('asmr').ifExists().execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	//No down migration
}
