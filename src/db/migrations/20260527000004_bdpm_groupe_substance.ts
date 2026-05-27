import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_groupe_substance')
    .ifNotExists()
    .addColumn('code_groupe', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('code_groupe_parent', 'integer')
    .addColumn('nom', 'varchar', (col) => col.notNull())
    .addColumn('date_modification', 'timestamptz')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_groupe_substance').ifExists().execute()
}
