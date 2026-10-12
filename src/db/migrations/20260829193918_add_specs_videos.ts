import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
    .createTable('ansm_videos')
    .ifNotExists()
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('url', 'varchar', (col) => col.notNull())
    .addColumn('title', 'varchar', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('ansm_videos_cis')
    .ifNotExists()
    .addColumn('CIS', 'varchar', (col) => col.primaryKey())
    .addColumn('id_video','integer', (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('ansm_videos').ifExists().execute();
  await db.schema.dropTable('ansm_videos_cis').ifExists().execute();
}
