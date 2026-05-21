"use server";

import "server-cli-only";
import db from "@/db";
import { SearchResult } from "@/db/types";
import { sql } from "kysely";
import { unstable_cache } from "next/cache";
import { getResumeSpecsATCLabels } from "@/db/utils/atc";
import { formatSpecialitesResume } from "@/utils/specialites";
import { computeSortScore } from "./searchScoring";
import { MatchReason, SearchResultItem } from "@/types/SearchTypes";


export const getSearchResults = unstable_cache(async function (
  query: string,
): Promise<SearchResultItem[]> {

  // empty query returns no results
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Normalize to lowercase+unaccented to match how tokens are stored in the index
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const matches = (await db
    .selectFrom("search_index")
    .selectAll()
    .select(({ fn, val }) => [
      fn("word_similarity", [val(normalizedQuery), "token"]).as("sml"),
    ])
    .where((eb) => {
      if (normalizedQuery.length <= 3) {
        // for very short queries, only match from the beginning to limit the number of results
        // also, we only match specialities
        return eb.and([
          eb("token", "like", `${normalizedQuery}%`),
          eb("match_type", "=", "name"),
        ]);
      }
      if (normalizedQuery.length <= 5) {
        // if the query is short, we only do ilike search to avoid too many results
        return eb("token", "like", `%${normalizedQuery}%`);
      }
      return eb.or([
        sql<boolean>`token %> ${normalizedQuery}`, // fuzzy-search using pg_trgm
        eb("token", "like", `%${normalizedQuery}%`), // exact match
      ])
    })
    .orderBy("sml", "desc")
    .orderBy(({ fn }) => fn("length", ["token"]))
    .execute()) as (SearchResult & { sml: number })[];

  if (matches.length === 0) return [];

  // Group by group_name to deduplicate, collect best score + match reasons
  const groupMap = new Map<string, { score: number; reasons: MatchReason[] }>();
  for (const match of matches) {
    const matchGroup = groupMap.get(match.group_name);
    const reason: MatchReason = { type: match.match_type, label: match.match_label };
    if (matchGroup) {
      matchGroup.score = Math.max(matchGroup.score, match.sml);
      // Deduplicate: the seed can produce identical rows per group, e.g. when
      // multiple subsIds resolve to the same substance name, or duplicate indicationsIds
      if (!matchGroup.reasons.some((r) => r.type === reason.type && r.label === reason.label)) {
        matchGroup.reasons.push(reason);
      }
    } else {
      groupMap.set(match.group_name, { score: match.sml, reasons: [reason] });
    }
  }

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

  // Attach match reasons, sort by score, cap output at 100 to keep cache entries bounded
  return withATC
    .map((group) => {
      const matchReasons = groupMap.get(group.groupName)?.reasons ?? [];
      return {
        ...group,
        matchReasons,
        score: computeSortScore(query, group.groupName, group.composants, matchReasons, groupMap.get(group.groupName)?.score ?? 0),
      };
    })
    .sort((a, b) => {
      const scoreA = computeSortScore(query, a.groupName, a.composants, a.matchReasons, groupMap.get(a.groupName)?.score ?? 0);
      const scoreB = computeSortScore(query, b.groupName, b.composants, b.matchReasons, groupMap.get(b.groupName)?.score ?? 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.groupName.localeCompare(b.groupName, "fr"); // alphabetical tiebreaker
    })
    .slice(0, 100);
},
  ["search-results"],
  { revalidate: 3600 } // 1 hour caching max
);
