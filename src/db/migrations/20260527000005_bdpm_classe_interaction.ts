import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_classe_interaction')
    .ifNotExists()
    .addColumn('code_classe', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('nom', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('date_modification', 'timestamptz')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_classe_interaction').ifExists().execute()
}
