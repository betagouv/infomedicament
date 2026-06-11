import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('url_has')
    .ifNotExists()
    .addColumn('code_ct', 'varchar', (col) => col.notNull())
    .addColumn('url', 'varchar')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('url_has').ifExists().execute()
}
