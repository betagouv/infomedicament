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
};

export async function lookupInteractions(
  substIds1: string[],
  substIds2: string[],
): Promise<InteractionResult[]> {
  if (substIds1.length === 0 || substIds2.length === 0) return [];

  return db
    .selectFrom("triam_interactions")
    .innerJoin(
      "triam_groupe_substance as gs1",
      "gs1.code_groupe_subst",
      "triam_interactions.code_groupe_subst1",
    )
    .innerJoin(
      "triam_groupe_substance as gs2",
      "gs2.code_groupe_subst",
      "triam_interactions.code_groupe_subst2",
    )
    .select([
      "triam_interactions.niveau",
      "triam_interactions.risque",
      "triam_interactions.conduite",
      "triam_interactions.commentaire",
      "gs1.nom_groupe_subst as subst1_name",
      "gs2.nom_groupe_subst as subst2_name",
    ])
    .where((eb) =>
      eb.or([
        eb.and([
          eb("triam_interactions.code_groupe_subst1", "in", substIds1),
          eb("triam_interactions.code_groupe_subst2", "in", substIds2),
        ]),
        eb.and([
          eb("triam_interactions.code_groupe_subst1", "in", substIds2),
          eb("triam_interactions.code_groupe_subst2", "in", substIds1),
        ]),
      ]),
    )
    .execute() as Promise<InteractionResult[]>;
}
