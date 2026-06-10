import "server-cli-only";
import db from "@/db";
import { InteractionsSearchEntry } from "@/db/types";
import { sql } from "kysely";

export async function searchInteractions(
  q: string,
): Promise<InteractionsSearchEntry[]> {
  if (q.length < 2) return [];

  return db
    .selectFrom("interactions_search")
    .select(["id", "label", "type", "subst_ids", "class_ids"])
    .where("label", "ilike", `%${q}%`)
    .orderBy(sql`word_similarity(${q}, label)`, "desc")
    .limit(20)
    .execute();
}

export type InteractionResult = {
  niveau: string | null;
  risque: string | null;
  conduite: string | null;
  commentaire: string | null;
  subst1Name: string;
  subst2Name: string;
  subst1ClassName: string | null;
  subst2ClassName: string | null;
  subst1Chapeau: string | null;
  subst2Chapeau: string | null;
};

export async function lookupInteractions(
  substIds1: string[],
  directClassIds1: string[],
  substIds2: string[],
  directClassIds2: string[],
): Promise<InteractionResult[]> {
  if (substIds1.length === 0 && directClassIds1.length === 0) return [];
  if (substIds2.length === 0 && directClassIds2.length === 0) return [];

  const toNums = (ids: string[]) => ids.map(Number).filter((n) => !isNaN(n));
  const groupIds1 = toNums(substIds1);
  const groupIds2 = toNums(substIds2);
  const classIdsDirect1 = toNums(directClassIds1);
  const classIdsDirect2 = toNums(directClassIds2);

  // Expand substance groups to their pharmacological classes, then merge with
  // any class IDs passed directly (for pure-class entries like "pamplemousse").
  const [classes1Rows, classes2Rows] = await Promise.all([
    groupIds1.length > 0
      ? db
          .selectFrom("ansm_classe_groupe_substance")
          .select("code_classe")
          .where("code_groupe", "in", groupIds1)
          .execute()
      : Promise.resolve([]),
    groupIds2.length > 0
      ? db
          .selectFrom("ansm_classe_groupe_substance")
          .select("code_classe")
          .where("code_groupe", "in", groupIds2)
          .execute()
      : Promise.resolve([]),
  ]);
  let classes1 = [
    ...new Set([...classIdsDirect1, ...classes1Rows.map((r) => r.code_classe)]),
  ];
  let classes2 = [
    ...new Set([...classIdsDirect2, ...classes2Rows.map((r) => r.code_classe)]),
  ];

  // Include "autres X" siblings (e.g. "autres hyperkaliémiants" when a specific one is present)
  const autresIds = (ids: number[]) =>
    ids.length === 0
      ? Promise.resolve([] as { code_classe: number }[])
      : db
          .selectFrom("ansm_classe_interaction as a")
          .select("a.code_classe")
          .where(
            sql<string>`unaccent(lower(a.nom))`,
            "in",
            db
              .selectFrom("ansm_classe_interaction as p")
              .select(sql<string>`unaccent(lower('autres ' || p.nom))`.as("nom"))
              .where("p.code_classe", "in", ids)
              .where("p.nom", "is not", null),
          )
          .execute();
  const [a1, a2] = await Promise.all([autresIds(classes1), autresIds(classes2)]);
  classes1 = [...new Set([...classes1, ...a1.map((r) => r.code_classe)])];
  classes2 = [...new Set([...classes2, ...a2.map((r) => r.code_classe)])];

  const rows = (await db
    .selectFrom("ansm_interaction")
    // LEFT JOIN because when slot is class-based, code_groupe_* is null and gs1/gs2 won't match.
    .leftJoin("ansm_groupe_substance as gs1", "gs1.code_groupe", "ansm_interaction.code_groupe_1")
    .leftJoin("ansm_groupe_substance as gs2", "gs2.code_groupe", "ansm_interaction.code_groupe_2")
    .leftJoin("ansm_classe_interaction as c1", "c1.code_classe", "ansm_interaction.code_classe_1")
    .leftJoin("ansm_classe_interaction as c2", "c2.code_classe", "ansm_interaction.code_classe_2")
    .select([
      "ansm_interaction.niveau",
      "ansm_interaction.risque",
      "ansm_interaction.conduite",
      "ansm_interaction.commentaire",
      sql<string>`CASE WHEN ansm_interaction.code_groupe_1 IS NOT NULL THEN gs1.nom ELSE c1.nom END`.as(
        "subst1Name",
      ),
      sql<string>`CASE WHEN ansm_interaction.code_groupe_2 IS NOT NULL THEN gs2.nom ELSE c2.nom END`.as(
        "subst2Name",
      ),
      sql<string | null>`CASE WHEN ansm_interaction.code_groupe_1 IS NOT NULL THEN NULL ELSE c1.nom END`.as(
        "subst1ClassName",
      ),
      sql<string | null>`CASE WHEN ansm_interaction.code_groupe_2 IS NOT NULL THEN NULL ELSE c2.nom END`.as(
        "subst2ClassName",
      ),
      sql<string | null>`CASE WHEN ansm_interaction.code_groupe_1 IS NOT NULL THEN NULL ELSE c1.description END`.as(
        "subst1Chapeau",
      ),
      sql<string | null>`CASE WHEN ansm_interaction.code_groupe_2 IS NOT NULL THEN NULL ELSE c2.description END`.as(
        "subst2Chapeau",
      ),
    ])
    .where((eb) => {
      // A slot matches if: group-based and code_groupe_* is in our group IDs,
      //                 OR class-based and code_classe_* is in our class IDs.
      const slot1Matches = (groupIds: number[], classIds: number[]) =>
        eb.or([
          ...(groupIds.length > 0
            ? [eb("ansm_interaction.code_groupe_1", "in", groupIds)]
            : []),
          ...(classIds.length > 0
            ? [eb("ansm_interaction.code_classe_1", "in", classIds)]
            : []),
        ]);
      const slot2Matches = (groupIds: number[], classIds: number[]) =>
        eb.or([
          ...(groupIds.length > 0
            ? [eb("ansm_interaction.code_groupe_2", "in", groupIds)]
            : []),
          ...(classIds.length > 0
            ? [eb("ansm_interaction.code_classe_2", "in", classIds)]
            : []),
        ]);
      // ansm_interaction stores interactions bidirectionally.
      return eb.and([slot1Matches(groupIds1, classes1), slot2Matches(groupIds2, classes2)]);
    })
    // Sort non-"autres" rows first so deduplication keeps the forward-direction row.
    .orderBy(sql`CASE WHEN c1.nom ILIKE 'autres %' THEN 1 ELSE 0 END`, "asc")
    .execute()) as InteractionResult[];

  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.niveau}|${r.risque}|${r.conduite}|${r.commentaire}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
