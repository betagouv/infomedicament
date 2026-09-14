import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('ref_pediatrie')
		.dropColumn('indication')
		.dropColumn('contre_indication')
		.dropColumn('avis')
		.dropColumn('mention')
		.execute();
	await db.schema
		.alterTable('ref_pediatrie')
		.addColumn('contre_indication', 'boolean')
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('ref_pediatrie')
		.dropColumn('contre_indication')
		.execute();
	await db.schema
		.alterTable('ref_pediatrie')
		.addColumn('indication', 'text')
		.addColumn('contre_indication', 'text')
		.addColumn('avis', 'text')
		.addColumn('mention', 'text')
		.execute();
}
