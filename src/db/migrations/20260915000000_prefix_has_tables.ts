import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("asmr").renameTo("has_asmr").execute();
  await db.schema.alterTable("smr").renameTo("has_smr").execute();
  await db.schema.alterTable("url_has").renameTo("has_url_has").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("has_url_has").renameTo("url_has").execute();
  await db.schema.alterTable("has_smr").renameTo("smr").execute();
  await db.schema.alterTable("has_asmr").renameTo("asmr").execute();
}
