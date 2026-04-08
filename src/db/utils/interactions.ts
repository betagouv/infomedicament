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
    .select(["id", "label", "type", "subst_ids"])
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
  subst1_name: string;
  subst2_name: string;
  subst1_class_name: string | null;
  subst2_class_name: string | null;
};

export async function lookupInteractions(
  substIds1: string[],
  substIds2: string[],
): Promise<InteractionResult[]> {
  if (substIds1.length === 0 || substIds2.length === 0) return [];

  // Step 1: resolve which pharmacological classes each substance set belongs to.
  // Interactions can be stored at the class level (classe/classe1 != 0) rather than
  // the individual substance level, so we need to know the classes upfront.
  const [classes1Rows, classes2Rows] = await Promise.all([
    db
      .selectFrom("triam_classe_grp_subst")
      .select("num_classe")
      .where("code_groupe", "in", substIds1)
      .execute(),
    db
      .selectFrom("triam_classe_grp_subst")
      .select("num_classe")
      .where("code_groupe", "in", substIds2)
      .execute(),
  ]);
  const classes1 = [...new Set(classes1Rows.map((r) => r.num_classe))];
  const classes2 = [...new Set(classes2Rows.map((r) => r.num_classe))];

  const rows = (await db
    .selectFrom("triam_interactions")
    // Step 2: LEFT JOIN (not INNER) because when classe != 0 the code_groupe_subst
    // value is a dummy sentinel (always 103530). The substance name won't be used
    // for class-based slots and we use the class name from c1/c2 instead.
    .leftJoin(
      "triam_groupe_substance as gs1",
      "gs1.code_groupe_subst",
      "triam_interactions.code_groupe_subst1",
    )
    .leftJoin(
      "triam_groupe_substance as gs2",
      "gs2.code_groupe_subst",
      "triam_interactions.code_groupe_subst2",
    )
    // Step 3: also join triam_classes so we can resolve class names for class-based slots
    .leftJoin("triam_classes as c1", "c1.num_classe", "triam_interactions.classe")
    .leftJoin("triam_classes as c2", "c2.num_classe", "triam_interactions.classe1")
    .select([
      "triam_interactions.niveau",
      "triam_interactions.risque",
      "triam_interactions.conduite",
      "triam_interactions.commentaire",
      // Step 4: display the substance name for direct slots, the class name for class-based slots
      sql<string>`CASE WHEN triam_interactions.classe = 0 THEN gs1.nom_groupe_subst ELSE c1.nom END`.as(
        "subst1_name",
      ),
      sql<string>`CASE WHEN triam_interactions.classe1 = 0 THEN gs2.nom_groupe_subst ELSE c2.nom END`.as(
        "subst2_name",
      ),
      sql<string | null>`CASE WHEN triam_interactions.classe = 0 THEN NULL ELSE c1.nom END`.as(
        "subst1_class_name",
      ),
      sql<string | null>`CASE WHEN triam_interactions.classe1 = 0 THEN NULL ELSE c2.nom END`.as(
        "subst2_class_name",
      ),
    ])
    .where((eb) => {
      // Step 5: a slot "matches a side" if:
      //   - direct slot (classe=0) and code_groupe_subst is in that side's substance IDs, OR
      //   - class slot (classe!=0) and the class number is in that side's class list
      const slot1Matches = (ids: string[], classes: number[]) =>
        eb.or([
          eb.and([
            eb("triam_interactions.classe", "=", 0),
            eb("triam_interactions.code_groupe_subst1", "in", ids),
          ]),
          ...(classes.length > 0
            ? [
              eb.and([
                eb("triam_interactions.classe", "!=", 0),
                eb("triam_interactions.classe", "in", classes),
              ]),
            ]
            : []),
        ]);

      const slot2Matches = (ids: string[], classes: number[]) =>
        eb.or([
          eb.and([
            eb("triam_interactions.classe1", "=", 0),
            eb("triam_interactions.code_groupe_subst2", "in", ids),
          ]),
          ...(classes.length > 0
            ? [
              eb.and([
                eb("triam_interactions.classe1", "!=", 0),
                eb("triam_interactions.classe1", "in", classes),
              ]),
            ]
            : []),
        ]);

      // Check both directions: (side1 vs side2) and (side2 vs side1)
      return eb.and([
        eb("triam_interactions.historique", "=", false),
        eb.or([
          eb.and([slot1Matches(substIds1, classes1), slot2Matches(substIds2, classes2)]),
          eb.and([slot1Matches(substIds2, classes2), slot2Matches(substIds1, classes1)]),
        ]),
      ]);
    })
    .execute()) as InteractionResult[];

  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = `${r.niveau}|${r.risque}|${r.conduite}|${r.commentaire}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
