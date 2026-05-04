import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("triam_classe_grp_subst")
    .ifNotExists()
    .addColumn("num_classe", "integer", (col) => col.notNull())
    .addColumn("code_groupe", "text", (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("triam_classe_grp_subst").execute();
}
