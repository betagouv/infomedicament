import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('ansm_specialite')
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

  await db.schema
    .createTable('ansm_atc')
    .ifNotExists()
    .addColumn('code', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('code_parent', 'integer')
    .addColumn('libelle_abr', 'varchar')
    .addColumn('libelle_court', 'varchar')
    .addColumn('libelle_long', 'varchar')
    .addColumn('libelle_anglais', 'varchar')
    .execute()

  await db.schema
    .createTable('ansm_classe_clinique')
    .ifNotExists()
    .addColumn('code', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('libelle_court', 'varchar')
    .addColumn('libelle_long', 'varchar')
    .execute()

  await db.schema
    .createTable('ansm_groupe_substance')
    .ifNotExists()
    .addColumn('code_groupe', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('code_groupe_parent', 'integer')
    .addColumn('nom', 'varchar')
    .addColumn('date_modification', 'timestamptz')
    .execute()

  await db.schema
    .createTable('ansm_classe_interaction')
    .ifNotExists()
    .addColumn('code_classe', 'integer', (col) => col.notNull().primaryKey())
    .addColumn('nom', 'varchar')
    .addColumn('description', 'text')
    .addColumn('date_modification', 'timestamptz')
    .execute()

  await db.schema
    .createTable('ansm_presentation')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull().primaryKey())
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('cip7', 'varchar')
    .addColumn('denomination', 'varchar')
    .addColumn('date_modification', 'timestamptz')
    .addColumn('statut_commercialisation', 'varchar')
    .addColumn('date_commercialisation', 'date')
    .execute()

  await db.schema
    .createTable('ansm_element')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('numero_element', 'integer', (col) => col.notNull())
    .addColumn('denomination', 'varchar')
    .addColumn('ordre', 'integer')
    .addPrimaryKeyConstraint('ansm_element_pkey', ['cis', 'numero_element'])
    .execute()

  await db.schema
    .createTable('ansm_specialite_atc')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('code_atc', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('ansm_specialite_atc_pkey', ['cis', 'code_atc'])
    .execute()

  await db.schema
    .createTable('ansm_specialite_classe_clinique')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('code_classe_clinique', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('ansm_specialite_classe_clinique_pkey', ['cis', 'code_classe_clinique'])
    .execute()

  await db.schema
    .createTable('ansm_classe_groupe_substance')
    .ifNotExists()
    .addColumn('code_classe', 'integer', (col) => col.notNull())
    .addColumn('code_groupe', 'integer', (col) => col.notNull())
    .addPrimaryKeyConstraint('ansm_classe_groupe_substance_pkey', ['code_classe', 'code_groupe'])
    .execute()

  await db.schema
    .createTable('ansm_substance_groupe_substance')
    .ifNotExists()
    .addColumn('code_groupe', 'integer', (col) => col.notNull())
    .addColumn('code_substance', 'varchar', (col) => col.notNull())
    .addColumn('date_modification', 'timestamptz')
    .addPrimaryKeyConstraint('ansm_substance_groupe_substance_pkey', ['code_groupe', 'code_substance'])
    .execute()

  await db.schema
    .createTable('ansm_interaction')
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

  await db.schema
    .createTable('ansm_composant')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('numero_element', 'integer', (col) => col.notNull())
    .addColumn('numero_composant', 'integer', (col) => col.notNull())
    .addColumn('code_substance', 'varchar')
    .addColumn('substance', 'varchar')
    .addColumn('nature', 'varchar')
    .addColumn('dosage', 'varchar')
    .addColumn('ordre', 'integer')
    .addPrimaryKeyConstraint('ansm_composant_pkey', ['cis', 'numero_element', 'numero_composant'])
    .execute()

  await db.schema
    .createTable('ansm_recipient')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull())
    .addColumn('numero_element', 'integer')
    .addColumn('numero_recipient', 'integer', (col) => col.notNull())
    .addColumn('nature_recipient', 'varchar')
    .addColumn('nombre', 'integer')
    .addColumn('quantite_contenance', 'numeric')
    .addColumn('code_unite_contenance', 'varchar')
    .addColumn('unite_contenance', 'varchar')
    .addPrimaryKeyConstraint('ansm_recipient_pkey', ['cip', 'numero_recipient'])
    .execute()

  await db.schema
    .createTable('ansm_dispositif')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull())
    .addColumn('numero_dispositif', 'integer', (col) => col.notNull())
    .addColumn('code_nature_dispositif', 'varchar')
    .addColumn('nature_dispositif', 'varchar')
    .addPrimaryKeyConstraint('ansm_dispositif_pkey', ['cip', 'numero_dispositif'])
    .execute()

  await db.schema
    .createTable('ansm_document')
    .ifNotExists()
    .addColumn('cis', 'varchar', (col) => col.notNull())
    .addColumn('type', 'varchar', (col) => col.notNull())
    .addColumn('date_modification', 'timestamptz')
    .addColumn('url', 'varchar')
    .addColumn('sha256', 'varchar')
    .addColumn('images', sql`text[]`)
    .addPrimaryKeyConstraint('ansm_document_pkey', ['cis', 'type'])
    .execute()

  await db.schema
    .createTable('ansm_caracteristique')
    .ifNotExists()
    .addColumn('cip', 'varchar', (col) => col.notNull())
    .addColumn('numero_recipient', 'integer', (col) => col.notNull())
    .addColumn('code_caracteristique', 'integer', (col) => col.notNull())
    .addColumn('ordre', 'integer')
    .addColumn('libelle', 'varchar')
    .addPrimaryKeyConstraint('ansm_caracteristique_pkey', ['cip', 'numero_recipient', 'code_caracteristique'])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('ansm_caracteristique').ifExists().execute()
  await db.schema.dropTable('ansm_document').ifExists().execute()
  await db.schema.dropTable('ansm_dispositif').ifExists().execute()
  await db.schema.dropTable('ansm_recipient').ifExists().execute()
  await db.schema.dropTable('ansm_composant').ifExists().execute()
  await db.schema.dropTable('ansm_interaction').ifExists().execute()
  await db.schema.dropTable('ansm_substance_groupe_substance').ifExists().execute()
  await db.schema.dropTable('ansm_classe_groupe_substance').ifExists().execute()
  await db.schema.dropTable('ansm_specialite_classe_clinique').ifExists().execute()
  await db.schema.dropTable('ansm_specialite_atc').ifExists().execute()
  await db.schema.dropTable('ansm_element').ifExists().execute()
  await db.schema.dropTable('ansm_presentation').ifExists().execute()
  await db.schema.dropTable('ansm_classe_interaction').ifExists().execute()
  await db.schema.dropTable('ansm_groupe_substance').ifExists().execute()
  await db.schema.dropTable('ansm_classe_clinique').ifExists().execute()
  await db.schema.dropTable('ansm_atc').ifExists().execute()
  await db.schema.dropTable('ansm_specialite').ifExists().execute()
}
