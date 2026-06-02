import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
    .createTable("resume_specialites")
    .ifNotExists()
    .addColumn("specId", "varchar", (col) => col.notNull())
    .addColumn("specName", "varchar")
    .addColumn("groupName", "varchar")
    .addColumn("composants", "varchar")
    .addColumn("subsIds", sql`text[]`)
    .addColumn("indicationsIds", sql`integer[]`)
    .addColumn("indicationsIdsNames", sql`character varying[]`)
    .addColumn("atc1Code", "varchar")
    .addColumn("atc2Code", "varchar")
    .addColumn("atc5Code", "text")
    .addColumn("ProcId", "varchar")
    .addColumn("isSurveillanceRenforcee", "boolean")
    .addColumn("StatutBdm", "integer")
    .addColumn("isAlertPregnancyPlan", "boolean")
    .addColumn("isAlertPregnancyMention", "boolean")
    .addColumn("isAlertPediatricContraindication", "boolean")
    .execute();

	await db.schema.createIndex('resume_specialites_specName_idx').ifNotExists().on('resume_specialites').column('specName').execute();

	//Rename type for medicaments letters 
	await db
		.updateTable('letters')
		.set({ type: "medicaments" })
		.where('type', '=', "specialites")
		.executeTakeFirstOrThrow();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('resume_specialites').ifExists().execute();

	//Rename type for medicaments letters 
	await db
		.updateTable('letters')
		.set({ type: "specialites" })
		.where('type', '=', "medicaments")
		.executeTakeFirstOrThrow();

}
