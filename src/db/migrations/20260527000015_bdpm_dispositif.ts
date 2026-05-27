import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_dispositif')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull())
    .addColumn('numero_dispositif', 'integer', (col) => col.notNull())
    .addColumn('code_nature_dispositif', 'varchar')
    .addColumn('nature_dispositif', 'varchar')
    .addPrimaryKeyConstraint('bdpm_dispositif_pkey', ['cip', 'numero_dispositif'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_dispositif').ifExists().execute()
}
