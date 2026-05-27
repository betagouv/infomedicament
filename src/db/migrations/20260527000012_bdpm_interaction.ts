import { type Kysely } from 'kysely'

// The datapackage schema defines a composite PK over (code_groupe_1, code_classe_1, code_groupe_2,
// code_classe_2), but each side uses either code_groupe_* OR code_classe_* (the other is NULL).
// PostgreSQL does not allow NULL in PK columns, so no PK constraint is set here.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('bdpm_interaction')
    .ifNotExists()
    .addColumn('code_groupe_1', 'integer')
    .addColumn('code_groupe_2', 'integer')
    .addColumn('code_classe_1', 'integer')
    .addColumn('code_classe_2', 'integer')
    .addColumn('niveau', 'varchar')
    .addColumn('risque', 'text')
    .addColumn('conduite', 'text')
    .addColumn('date_modification', 'timestamptz')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('bdpm_interaction').ifExists().execute()
}
