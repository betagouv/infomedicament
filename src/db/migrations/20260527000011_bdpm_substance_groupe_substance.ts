import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_substance_groupe_substance')
    .ifNotExists()
    .addColumn('code_groupe', 'integer', (col) => col.notNull())
    .addColumn('code_substance', 'varchar', (col) => col.notNull())
    .addColumn('date_modification', 'timestamptz')
    .addPrimaryKeyConstraint('bdpm_substance_groupe_substance_pkey', ['code_groupe', 'code_substance'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_substance_groupe_substance').ifExists().execute()
}
