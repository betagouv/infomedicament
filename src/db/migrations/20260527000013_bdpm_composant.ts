import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_composant')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('numero_element', 'integer', (col) => col.notNull())
    .addColumn('numero_composant', 'integer', (col) => col.notNull())
    .addColumn('code_substance', 'varchar')
    .addColumn('substance', 'varchar')
    .addColumn('nature', 'varchar')
    .addColumn('dosage', 'varchar')
    .addColumn('ordre', 'integer')
    .addPrimaryKeyConstraint('bdpm_composant_pkey', ['cis', 'numero_element', 'numero_composant'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_composant').ifExists().execute()
}
