import { type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("specialites_metadata")
		.ifNotExists()
		.addColumn("CIS", "integer", (col) => col.notNull().primaryKey())
		.addColumn("title", "varchar", (col) => col.notNull())
		.addColumn("description", "varchar")
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("specialites_metadata").ifExists().execute();
}