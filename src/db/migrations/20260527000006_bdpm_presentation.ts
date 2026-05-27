import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_presentation')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull().primaryKey())
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('cip7', 'varchar')
    .addColumn('denomination', 'varchar')
    .addColumn('date_modification', 'timestamptz')
    .addColumn('statut_commercialisation', 'varchar')
    .addColumn('date_commercialisation', 'date')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_presentation').ifExists().execute()
}
