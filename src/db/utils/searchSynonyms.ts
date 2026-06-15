import db from "@/db";
import { unstable_cache } from "next/cache";
import { SearchSynonym } from "@/db/types";

// Same normalization as search.ts: lowercase + strip accents. Trim for safety.
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .trim();
}

// Bidirectional stem match: true if either word is a prefix of the other.
// Tolerates French plurals ("tetes" ~ "tete"). Min length 4 avoids short-word noise.
function stemMatches(a: string, b: string): boolean {
  const minLen = Math.min(a.length, b.length);
  return minLen >= 4 && (a.startsWith(b) || b.startsWith(a));
}

// An alias word is "covered" by the query when the query contains it. Short connector
// words (de, du, la, a, …) must match exactly; longer words tolerate plurals via stem match.
function wordCovered(aliasWord: string, queryWords: string[]): boolean {
  if (aliasWord.length < 4) return queryWords.includes(aliasWord);
  return queryWords.some((qw) => stemMatches(qw, aliasWord));
}

function queryContainsAlias(queryWords: string[], aliasNormalized: string): boolean {
  const aliasWords = aliasNormalized.split(/\s+/).filter(Boolean);
  return aliasWords.length > 0 && aliasWords.every((aw) => wordCovered(aw, queryWords));
}

/**
 * Expand a (normalized) query with the canonical terms of any matching synonym alias.
 * Returns the original query plus deduped canonical terms (normalized for the index),
 * original query first. Additive: a query that matches no alias is returned unchanged.
 */
export function expandQuery(normalizedQuery: string, synonyms: SearchSynonym[]): string[] {
  const queryWords = normalize(normalizedQuery).split(/\s+/).filter(Boolean);
  const terms = [normalizedQuery];
  const seen = new Set([normalizedQuery]);
  for (const syn of synonyms) {
    if (queryContainsAlias(queryWords, normalize(syn.alias))) {
      const term = normalize(syn.canonical);
      if (term && !seen.has(term)) {
        seen.add(term);
        terms.push(term);
      }
    }
  }
  return terms;
}

// Small curated table — load all rows once and cache, like getSearchResults.
export const getSynonymMap = unstable_cache(
  async function (): Promise<SearchSynonym[]> {
    return db.selectFrom("search_synonyms").selectAll().execute();
  },
  ["search-synonyms"],
  { revalidate: 3600 },
);
