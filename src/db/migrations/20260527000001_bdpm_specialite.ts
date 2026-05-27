import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_specialite')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull().primaryKey())
    .addColumn('denomination', 'varchar')
    .addColumn('generique', 'varchar')
    .addColumn('procedure', 'integer')
    .addColumn('date_amm', 'date')
    .addColumn('statut_amm', 'varchar')
    .addColumn('date_modification', 'timestamptz')
    .addColumn('disponibilite', 'varchar')
    .addColumn('commercialisation', 'boolean')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_specialite').ifExists().execute()
}
