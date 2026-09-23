import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("resume_specialites")
    .addColumn("subsMainNames", "varchar")
    .execute();
  await db.schema
    .alterTable("resume_medicaments")
    .addColumn("subsNamesIds", "varchar")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("resume_specialites")
    .dropColumn("subsMainNames")
    .execute();
  await db.schema
    .alterTable("resume_medicaments")
    .dropColumn("subsNamesIds")
    .execute();
}
