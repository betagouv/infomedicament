import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_document')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('type', 'varchar', (col) => col.notNull())
    .addColumn('date_modification', 'timestamptz')
    .addColumn('url', 'varchar')
    .addColumn('sha256', 'varchar')
    .addColumn('images', sql`text[]`)
    .addPrimaryKeyConstraint('bdpm_document_pkey', ['cis', 'type'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_document').ifExists().execute()
}
