import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_classe_groupe_substance')
    .ifNotExists()
    .addColumn('code_classe', 'integer', (col) => col.notNull())
    .addColumn('code_groupe', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('bdpm_classe_groupe_substance_pkey', ['code_classe', 'code_groupe'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_classe_groupe_substance').ifExists().execute()
}
