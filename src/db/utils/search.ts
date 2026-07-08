"use server";

import "server-cli-only";
import db from "@/db";
import { SearchResult } from "@/db/types";
import { unstable_cache } from "next/cache";
import { getResumeSpecsATCLabels } from "@/db/utils/atc";
import { formatSpecialitesResume } from "@/utils/specialites";
import { computeSortScore } from "./searchScoring";
import { expandQuery, getSynonymMap } from "./searchSynonyms";
import { MatchReason, SearchResultItem } from "@/types/SearchTypes";
import { normalizeString } from "@/utils/alphabeticNav";
import {
  buildRequiredTermGroups,
  rowMatchesRequiredTermsPredicate,
} from "./searchTerms";

const MIN_SEARCH_SIMILARITY = 0.55;

export type SearchIndexMatch = SearchResult & {
  sml: number;
};

type GroupMatch = {
  score: number;
  reasons: MatchReason[];
};

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
  // Gives us [["mal", "tête"], ["céphalées"]]
  // Eg: when searching for "acide folique" we dont want to match on "acide" alone
  const requiredTermGroups = buildRequiredTermGroups(queryAndSynonyms);
  if (requiredTermGroups.length === 0) {
    return [];
  }

  const matchesQuery = db
    .selectFrom("search_index")
    .selectAll()
    .select((eb) =>
      eb
        .fn<number>(
          "greatest",
          queryAndSynonyms.map((term) =>
            eb.fn<number>("word_similarity", [eb.val(term), "token"]),
          ),
        )
        .as("sml"),
    )
    .where((eb) => rowMatchesRequiredTermsPredicate(eb, requiredTermGroups))
    .as("matches");

  return await db
    .selectFrom(matchesQuery)
    .selectAll()
    .where("sml", ">=", MIN_SEARCH_SIMILARITY)
    .orderBy("sml", "desc")
    .orderBy(({ fn }) => fn("length", ["token"]))
    .execute();
}

function groupMatches(matches: SearchIndexMatch[]) {
  if (matches.length === 0) return undefined;

  // Group by group_name to deduplicate, collect best score + match reasons
  const groupMap = new Map<string, GroupMatch>();
  // Per-spécialité name similarity: best sml of a "name" token attributed to a specId.
  // Lets us rank variants within a group (e.g. "Doliprane 1000" above "Doliprane 500").
  const specNameSml = new Map<string, number>();
  for (const match of matches) {
    const matchGroup = groupMap.get(match.group_name);
    const reason: MatchReason = {
      type: match.match_type,
      label: match.match_label,
    };
    if (matchGroup) {
      matchGroup.score = Math.max(matchGroup.score, match.sml);
      // Deduplicate: the seed can produce identical rows per group, e.g. when
      // multiple subsIds resolve to the same substance name, or duplicate indicationsIds
      if (
        !matchGroup.reasons.some(
          (r) => r.type === reason.type && r.label === reason.label,
        )
      ) {
        matchGroup.reasons.push(reason);
      }
    } else {
      groupMap.set(match.group_name, {
        score: match.sml,
        reasons: [reason],
      });
    }
    if (match.match_type === "name" && match.spec_id) {
      specNameSml.set(
        match.spec_id,
        Math.max(specNameSml.get(match.spec_id) ?? 0, match.sml),
      );
    }
  }
  return { groupMap, specNameSml };
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
  const groupNames = [...groupMap.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 500)
    .map(([name]) => name);
  const rawGroups = await db
    .selectFrom("resume_specialites")
    .where("groupName", "in", groupNames)
    .selectAll()
    .execute();

  // Enrich with ATC labels + alerts
  const formatted = formatSpecialitesResume(rawGroups);
  const withATC = await getResumeSpecsATCLabels(formatted);

  // Attach match reasons, score per spécialité, sort, cap output at 200 to keep cache entries bounded
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

export const getSearchResults = unstable_cache(
  async function (query: string): Promise<SearchResultItem[]> {
    const matches = await getSearchMatches(query);
    console.log(matches);
    return getSearchResultsFromMatches(query, matches);
  },
  ["search-results"],
  { revalidate: 3600 }, // 1 hour caching max
);
