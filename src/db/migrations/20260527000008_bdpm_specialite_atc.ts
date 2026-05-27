import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_specialite_atc')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('code_atc', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('bdpm_specialite_atc_pkey', ['cis', 'code_atc'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_specialite_atc').ifExists().execute()
}
