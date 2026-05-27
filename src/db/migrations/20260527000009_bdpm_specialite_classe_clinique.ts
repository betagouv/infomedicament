import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_specialite_classe_clinique')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('code_classe_clinique', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('bdpm_specialite_classe_clinique_pkey', ['cis', 'code_classe_clinique'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_specialite_classe_clinique').ifExists().execute()
}
