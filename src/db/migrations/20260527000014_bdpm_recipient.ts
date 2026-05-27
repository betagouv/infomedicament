import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_recipient')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull())
    .addColumn('numero_element', 'integer')
    .addColumn('numero_recipient', 'integer', (col) => col.notNull())
    .addColumn('nature_recipient', 'varchar')
    .addColumn('nombre', 'integer')
    .addColumn('quantite_contenance', 'numeric')
    .addColumn('code_unite_contenance', 'varchar')
    .addColumn('unite_contenance', 'varchar')
    .addPrimaryKeyConstraint('bdpm_recipient_pkey', ['cip', 'numero_recipient'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_recipient').ifExists().execute()
}
