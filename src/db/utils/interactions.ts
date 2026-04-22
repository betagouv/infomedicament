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

  // Expand substance groups to their pharmacological classes, then merge with
  // any class IDs passed directly (for pure-class entries like "pamplemousse").
  const [classes1Rows, classes2Rows] = await Promise.all([
    substIds1.length > 0
      ? db
          .selectFrom("triam_classe_grp_subst")
          .select("num_classe")
          .where("code_groupe", "in", substIds1)
          .execute()
      : Promise.resolve([]),
    substIds2.length > 0
      ? db
          .selectFrom("triam_classe_grp_subst")
          .select("num_classe")
          .where("code_groupe", "in", substIds2)
          .execute()
      : Promise.resolve([]),
  ]);
  let classes1 = [
    ...new Set([...directClassIds1.map(Number), ...classes1Rows.map((r) => r.num_classe)]),
  ];
  let classes2 = [
    ...new Set([...directClassIds2.map(Number), ...classes2Rows.map((r) => r.num_classe)]),
  ];

  // Include "autres X" siblings (e.g. 758 "autres hyperkaliémiants" when 133 is present)
  const autresIds = (ids: number[]) =>
    ids.length === 0
      ? Promise.resolve([] as { num_classe: number }[])
      : db
          .selectFrom("triam_classes as a")
          .select("a.num_classe")
          .where(
            sql<string>`unaccent(lower(a.nom))`,
            "in",
            db
              .selectFrom("triam_classes as p")
              .select(sql<string>`unaccent(lower('autres ' || p.nom))`.as("nom"))
              .where("p.num_classe", "in", ids),
          )
          .execute();
  const [a1, a2] = await Promise.all([autresIds(classes1), autresIds(classes2)]);
  classes1 = [...new Set([...classes1, ...a1.map((r) => r.num_classe)])];
  classes2 = [...new Set([...classes2, ...a2.map((r) => r.num_classe)])];

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
      sql<string>`CASE WHEN triam_interactions.classe = 0 THEN gs1.nom_groupe_subst ELSE c1.nom END`.as(
        "subst1Name",
      ),
      sql<string>`CASE WHEN triam_interactions.classe1 = 0 THEN gs2.nom_groupe_subst ELSE c2.nom END`.as(
        "subst2Name",
      ),
      sql<string | null>`CASE WHEN triam_interactions.classe = 0 THEN NULL ELSE c1.nom END`.as(
        "subst1ClassName",
      ),
      sql<string | null>`CASE WHEN triam_interactions.classe1 = 0 THEN NULL ELSE c2.nom END`.as(
        "subst2ClassName",
      ),
      sql<string | null>`CASE WHEN triam_interactions.classe = 0 THEN NULL ELSE c1.chapeau END`.as(
        "subst1Chapeau",
      ),
      sql<string | null>`CASE WHEN triam_interactions.classe1 = 0 THEN NULL ELSE c2.chapeau END`.as(
        "subst2Chapeau",
      ),
    ])
    .where((eb) => {
      // A slot "matches a side" if:
      //   - direct slot (classe=0) and code_groupe_subst is in that side's substance IDs, OR
      //   - class slot (classe!=0) and the class number is in that side's class list
      const slot1Matches = (ids: string[], classes: number[]) =>
        eb.or([
          ...(ids.length > 0
            ? [
                eb.and([
                  eb("triam_interactions.classe", "=", 0),
                  eb("triam_interactions.code_groupe_subst1", "in", ids),
                ]),
              ]
            : []),
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
          ...(ids.length > 0
            ? [
                eb.and([
                  eb("triam_interactions.classe1", "=", 0),
                  eb("triam_interactions.code_groupe_subst2", "in", ids),
                ]),
              ]
            : []),
          ...(classes.length > 0
            ? [
                eb.and([
                  eb("triam_interactions.classe1", "!=", 0),
                  eb("triam_interactions.classe1", "in", classes),
                ]),
              ]
            : []),
        ]);

      // TRIAM stores every interaction bidirectionally, so querying only the forward
      // direction always finds the correctly-oriented row without needing a swap.
      return eb.and([
        eb("triam_interactions.historique", "=", false),
        eb.and([slot1Matches(substIds1, classes1), slot2Matches(substIds2, classes2)]),
      ]);
    })
    // TRIAM stores each interaction bidirectionally. Without this ordering,
    // deduplication could keep the reversed row and show "autres X" on the wrong slot.
    // Sorting non-"autres" rows first ensures the forward direction survives dedup.
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
