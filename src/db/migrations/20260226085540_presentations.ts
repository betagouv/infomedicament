import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('presentations')
		.alterColumn('qtecontenance', (col) => col.setDataType("double precision"))
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('presentations')
		.alterColumn('qtecontenance', (col) => col.setDataType("integer"))
		.execute();
}
