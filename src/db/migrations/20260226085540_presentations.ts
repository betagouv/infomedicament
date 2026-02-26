import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('presentations')
		.alterColumn('nbrrecipient', (col) => col.setDataType("double precision"))
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('presentations')
		.alterColumn('nbrrecipient', (col) => col.setDataType("integer"))
		.execute();
}
