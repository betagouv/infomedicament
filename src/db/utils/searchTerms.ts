import {
  AliasableExpression,
  Expression,
  ExpressionBuilder,
  SqlBool,
  sql,
} from "kysely";
import type { Database } from "@/db/types";

const CONNECTOR_WORDS = new Set([
  "a",
  "au",
  "aux",
  "d",
  "de",
  "des",
  "du",
  "en",
  "et",
  "l",
  "la",
  "le",
  "les",
]);

function buildRequiredTermGroups(terms: string[]): string[][] {
  const requiredTermGroupsByKey = new Map<string, string[]>();

  for (const term of terms) {
    const words = term.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const meaningfulWords = words.filter((word) => !CONNECTOR_WORDS.has(word));
    const requiredTerms = [...new Set(meaningfulWords)];
    const key = requiredTerms.join(" ");

    if (requiredTerms.length > 0 && !requiredTermGroupsByKey.has(key)) {
      requiredTermGroupsByKey.set(key, requiredTerms);
    }
  }

  return [...requiredTermGroupsByKey.values()];
}

export function termsSimilarityExpression(
  eb: ExpressionBuilder<Database, "search_index">,
  terms: string[],
): AliasableExpression<number> {
  const termSimilarities = terms.map((term) =>
    eb.fn<number>("word_similarity", [eb.val(term), "token"]),
  );

  return termSimilarities.length === 1
    ? termSimilarities[0]
    : eb.fn<number>("greatest", termSimilarities);
}

function wordMatchPredicate(
  eb: ExpressionBuilder<Database, "search_index">,
  word: string,
): Expression<SqlBool> {
  // for very short queries, only match from the beginning to limit the number of results
  // also, we only match specialities
  if (word.length <= 3) {
    return eb.and([
      eb("token", "like", `${word}%`),
      eb("match_type", "=", "name"),
    ]);
  }
  // if the query is short, we only do ilike search to avoid too many results
  if (word.length <= 5) {
    return eb("token", "like", `%${word}%`);
  }
  return eb.or([
    sql<boolean>`${eb.ref("token")} %> ${word}`,
    eb("token", "like", `%${word}%`),
  ]);
}

export function rowMatchesRequiredTermsPredicate(
  eb: ExpressionBuilder<Database, "search_index">,
  terms: string[],
): Expression<SqlBool> {
  // Gives us [["mal", "tête"], ["céphalées"]]
  // Eg: when searching for "acide folique" we dont want to match on "acide" alone
  const requiredTermGroups = buildRequiredTermGroups(terms);

  if (requiredTermGroups.length === 0) return eb.val(false);

  const requiredTermGroupPredicates = requiredTermGroups.map((requiredTerms) =>
    eb.and(requiredTerms.map((word) => wordMatchPredicate(eb, word))),
  );

  return eb.or(requiredTermGroupPredicates);
}
