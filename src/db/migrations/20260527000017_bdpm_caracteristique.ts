import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_caracteristique')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull())
    .addColumn('numero_recipient', 'integer', (col) => col.notNull())
    .addColumn('code_caracteristique', 'integer', (col) => col.notNull())
    .addColumn('ordre', 'integer')
    .addColumn('libelle', 'varchar')
    .addPrimaryKeyConstraint('bdpm_caracteristique_pkey', ['cip', 'numero_recipient', 'code_caracteristique'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_caracteristique').ifExists().execute()
}
