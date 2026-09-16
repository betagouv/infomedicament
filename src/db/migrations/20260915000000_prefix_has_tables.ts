import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx.schema.alterTable("asmr").renameTo("has_asmr").execute();
    await trx.schema.alterTable("smr").renameTo("has_smr").execute();
  });
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.transaction().execute(async (trx) => {
    await trx.schema.alterTable("has_smr").renameTo("smr").execute();
    await trx.schema.alterTable("has_asmr").renameTo("asmr").execute();
  });
}
