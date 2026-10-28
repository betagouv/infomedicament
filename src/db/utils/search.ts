"use server";

import "server-cli-only";
import db from "@/db";
import { getResumeSpecsATCLabels } from "@/db/utils/atc";
import { formatSpecialitesResume } from "@/utils/specialites";
import { computeSortScore } from "./searchScoring";
import { expandQuery, getSynonymMap } from "./searchSynonyms";
import { SearchResultItem } from "@/types/SearchTypes";
import { normalizeString } from "@/utils/alphabeticNav";
import {
  groupMatches,
  getCandidateGroupNames,
  type SearchIndexMatch,
} from "./searchGrouping";
import {
  rowMatchesRequiredTermsPredicate,
  termsSimilarityExpression,
} from "./searchTerms";

export type { SearchIndexMatch } from "./searchGrouping";

const MIN_SEARCH_SIMILARITY = 0.55;

export async function getSearchMatches(
  query: string,
): Promise<SearchIndexMatch[]> {
  // empty query returns no results
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Normalize to lowercase+unaccented to match how tokens are stored in the index
  const normalizedQuery = normalizeString(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  // Expand with curated synonyms: a lay term ("mal de tête") adds its canonical
  // medical term ("céphalées") as an extra search term. Additive — no synonym match
  // leaves terms = [normalizedQuery], i.e. unchanged behaviour.
  const queryAndSynonyms = expandQuery(normalizedQuery, await getSynonymMap());

  const matchesQuery = db
    .selectFrom("search_index")
    .selectAll()
    .select((eb) => {
      const smlExpr = termsSimilarityExpression(eb, queryAndSynonyms);
      return smlExpr.as("sml");
    })
    .where((eb) => rowMatchesRequiredTermsPredicate(eb, queryAndSynonyms))
    .as("matches");

  return await db
    .selectFrom(matchesQuery)
    .selectAll()
    .where("sml", ">=", MIN_SEARCH_SIMILARITY)
    .orderBy("sml", "desc")
    .orderBy(({ fn }) => fn("length", ["token"]))
    .execute();
}

export async function getSearchResultsFromMatches(
  query: string,
  matches: SearchIndexMatch[],
): Promise<SearchResultItem[]> {
  const grouped = groupMatches(matches);
  if (!grouped) return [];

  const { groupMap, specNameSml } = grouped;

  // Fetch up to 500 candidate groups so computeSortScore can rank them properly
  // before trimming to the final 100. A tighter pre-filter here caused well-known
  // brand names (e.g. DOLIPRANE when searching "paracétamol") to be silently dropped
  // because they shared a max score with many generic name matches.
  const groupNames = getCandidateGroupNames(groupMap);
  const rawGroups = await db
    .selectFrom("resume_specialites")
    .where("groupName", "in", groupNames)
    .selectAll()
    .execute();

  // Enrich with ATC labels + alerts
  const formatted = formatSpecialitesResume(rawGroups);
  const withATC = await getResumeSpecsATCLabels(formatted);

  // Attach match reasons, score per spécialité, sort, cap output at 200 to keep result payloads bounded
  return withATC
    .map((spec) => {
      const matchReasons = groupMap.get(spec.groupName)?.reasons ?? [];
      // Prefer this spécialité's own name similarity so variants rank against the query
      // individually; fall back to the group's best score for substance/atc/indication matches.
      const baseSml =
        specNameSml.get(spec.specId) ??
        groupMap.get(spec.groupName)?.score ??
        0;
      return {
        ...spec,
        matchReasons,
        score: computeSortScore(
          query,
          spec.specName,
          spec.composants,
          matchReasons,
          baseSml,
        ),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.specName.localeCompare(b.specName, "fr"); // alphabetical tiebreaker
    });
}

export async function getSearchResults(
  query: string,
): Promise<SearchResultItem[]> {
  const matches = await getSearchMatches(query);
  return getSearchResultsFromMatches(query, matches);
}
