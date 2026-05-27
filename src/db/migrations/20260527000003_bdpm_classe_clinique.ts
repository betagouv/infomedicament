import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_classe_clinique')
    .ifNotExists()
    .addColumn('code', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('libelle_court', 'varchar', (col) => col.notNull())
    .addColumn('libelle_long', 'varchar')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_classe_clinique').ifExists().execute()
}
