import {
  AliasableExpression,
  Expression,
  ExpressionBuilder,
  SqlBool,
  sql,
} from "kysely";
import type { Database } from "@/db/types";
import { normalizeString } from "@/utils/alphabeticNav";

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

// Units are literal constraints even when their labels are long enough to allow
// typos in ordinary text. No conversion between units is implied.
const UNITS = new Set([
  "%",
  "g",
  "mg",
  "kg",
  "ng",
  "pg",
  "µg",
  "μg",
  "ug",
  "mcg",
  "l",
  "ml",
  "cl",
  "dl",
  "µl",
  "μl",
  "ul",
  "mmol",
  "mol",
  "meq",
  "u",
  "ui",
  "iu",
  "mui",
  "bq",
  "kbq",
  "mbq",
  "gbq",
  "gramme",
  "grammes",
  "milligramme",
  "milligrammes",
  "microgramme",
  "microgrammes",
  "nanogramme",
  "nanogrammes",
  "litre",
  "litres",
  "millilitre",
  "millilitres",
]);

type Term = {
  value: string;
  kind: "text" | "number" | "unit";
  unfinished: boolean;
  unit?: string;
  unitUnfinished?: boolean;
};
type TermGroup = { terms: Term[]; standaloneText: boolean; phrase: string };
export type SearchMatchOptions = { autocomplete?: boolean };
type Builder = ExpressionBuilder<Database, "search_index">;

function buildRequiredTermGroups(
  queries: string[],
  { autocomplete = false }: SearchMatchOptions,
): TermGroup[] {
  return queries.flatMap((query, alternativeIndex) => {
    const normalized = normalizeString(query);
    // Keep decimals intact, split attached units, and preserve ATC codes as text.
    const tokens = [
      ...normalized.matchAll(
        /[\p{L}µμ][\p{L}\p{N}µμ]*|[0-9]+(?:[.,][0-9]+)?|%/gu,
      ),
    ];
    const terms: Term[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const value = token[0];
      if (tokens.length > 1 && CONNECTOR_WORDS.has(value)) continue;
      const isFinal =
        i === tokens.length - 1 &&
        token.index! + value.length === normalized.length;
      // Only the original query's final term can be an unfinished input.
      const unfinished = autocomplete && alternativeIndex === 0 && isFinal;
      if (/^[0-9]/.test(value)) {
        const next = tokens[i + 1];
        const adjacentUnit =
          next &&
          (UNITS.has(next[0]) ||
            (autocomplete &&
              alternativeIndex === 0 &&
              i + 1 === tokens.length - 1 &&
              [...UNITS].some((unit) => unit.startsWith(next[0])))) &&
          /^\s*$/.test(
            normalized.slice(token.index! + value.length, next.index),
          );
        terms.push({
          value,
          kind: "number",
          unfinished,
          ...(adjacentUnit && {
            unit: next[0],
            unitUnfinished:
              autocomplete &&
              alternativeIndex === 0 &&
              i + 1 === tokens.length - 1 &&
              next.index! + next[0].length === normalized.length,
          }),
        });
        if (adjacentUnit) i++;
      } else {
        terms.push({
          value,
          kind: UNITS.has(value) ? "unit" : "text",
          unfinished,
        });
      }
    }
    if (!terms.length) return [];
    return [
      {
        terms,
        standaloneText: tokens.length === 1 && terms[0].kind === "text",
        phrase: tokens.map((token) => token[0].replace(",", ".")).join(" "),
      },
    ];
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function numberPattern(value: string, unfinished: boolean): string {
  if (unfinished)
    return escapeRegex(value.replace(",", ".")).replace(/\\\./g, "[.,]");
  const [integer, fraction = ""] = value.replace(",", ".").split(".");
  const significantFraction = fraction.replace(/0+$/, "");
  const number =
    `0*${integer.replace(/^0+(?=\d)/, "")}` +
    (significantFraction ? `[.,]${significantFraction}0*` : "(?:[.,]0+)?");
  return `${number}(?![[:digit:]]|[.,][[:digit:]])`;
}

function literalPredicate(
  eb: Builder,
  term: Term,
  group: TermGroup,
  allowCompletion: boolean,
): Expression<SqlBool> {
  const { value, kind } = term;
  if (kind === "number") {
    // Do not match suffixes of numbers/codes or fractional parts of decimals.
    let pattern = `(?<![[:alnum:]])(?<![[:digit:]][.,])${numberPattern(value, allowCompletion && term.unfinished)}`;
    if (term.unit) {
      pattern += `[[:space:]]*${escapeRegex(term.unit)}`;
      if (!(allowCompletion && term.unitUnfinished))
        pattern += "(?![[:alpha:]])";
    }
    return eb("token", "~", pattern);
  }
  if (group.standaloneText && value.length <= 3) {
    return eb.and([
      eb("token", "like", `${value}%`),
      eb("match_type", "=", "name"),
    ]);
  }
  if (group.standaloneText) return eb("token", "like", `%${value}%`);
  const end =
    kind === "unit" && !(allowCompletion && term.unfinished)
      ? "(?![[:alnum:]])"
      : "";
  return eb("token", "~", `\\m${escapeRegex(value)}${end}`);
}

function groupPredicate(
  eb: Builder,
  group: TermGroup,
  fuzzy: boolean,
  allowCompletion: boolean,
): Expression<SqlBool> {
  return eb.and(
    group.terms.map((term) => {
      const literal = literalPredicate(eb, term, group, allowCompletion);
      if (
        !fuzzy ||
        term.kind !== "text" ||
        term.value.length < 6 ||
        /\d/.test(term.value)
      )
        return literal;
      return eb.or([
        literal,
        eb.and([
          sql<boolean>`${eb.ref("token")} %> ${term.value}`,
          eb(
            eb.fn<number>("word_similarity", [eb.val(term.value), "token"]),
            ">=",
            0.55,
          ),
        ]),
      ]);
    }),
  );
}

export function rowMatchesRequiredTermsPredicate(
  eb: Builder,
  queries: string[],
  options: SearchMatchOptions = {},
): Expression<SqlBool> {
  return eb.or(
    buildRequiredTermGroups(queries, options).map((group) =>
      groupPredicate(eb, group, true, true),
    ),
  );
}

export function termsSimilarityExpression(
  eb: Builder,
  queries: string[],
  options: SearchMatchOptions = {},
): AliasableExpression<number> {
  const scores = buildRequiredTermGroups(queries, options).map(
    (group, index) => {
      const similarity = eb.fn<number>("word_similarity", [
        eb.val(group.phrase),
        "token",
      ]);
      const exactTerms = groupPredicate(eb, group, false, false);
      const literalTerms = groupPredicate(eb, group, false, true);
      // Similarity breaks ties only: literal matches survive regardless of query
      // order/length, and exact numbers rank ahead of unfinished completions.
      const phrase = group.phrase
        .split(" ")
        .map(escapeRegex)
        .join("[[:space:]]*");
      const phraseMatch = eb("token", "~", `\\m${phrase}(?![[:alnum:]])`);
      const score = eb
        .case()
        .when(eb.and([exactTerms, eb("token", "=", group.phrase)]))
        .then(1)
        .when(eb.and([exactTerms, phraseMatch]))
        .then(0.95)
        .when(exactTerms)
        .then(sql<number>`0.9 + 0.04 * ${similarity}`)
        .when(literalTerms)
        .then(sql<number>`0.8 + 0.04 * ${similarity}`)
        .when(groupPredicate(eb, group, true, true))
        .then(sql<number>`0.5 + 0.2 * ${similarity}`)
        .else(0)
        .end();
      // Direct matches rank ahead of synonym-only alternatives.
      return index === 0 ? score : sql<number>`${score} * 0.49`;
    },
  );
  return scores.length === 0
    ? sql<number>`0`
    : scores.length === 1
      ? scores[0]
      : eb.fn<number>("greatest", scores);
}
