import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
    .createTable('ansm_stock')
    .ifNotExists()
    .addColumn('CIS', 'varchar', (col) => col.notNull())
    .addColumn('CIP', 'varchar')
    .addColumn('status_id', 'integer', (col) => col.notNull())
    .addColumn('status', 'varchar')
    .addColumn('date_begin', 'date')
    .addColumn('date_update', 'date')
    .addColumn('date_end', 'date')
    .addColumn('link', 'varchar')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('ansm_stock').ifExists().execute();
}
