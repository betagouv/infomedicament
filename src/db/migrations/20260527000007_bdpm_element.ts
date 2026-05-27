import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_element')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('numero_element', 'integer', (col) => col.notNull())
    .addColumn('denomination', 'varchar')
    .addColumn('ordre', 'integer')
    .addPrimaryKeyConstraint('bdpm_element_pkey', ['cis', 'numero_element'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_element').ifExists().execute()
}
