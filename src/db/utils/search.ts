"use server";

import "server-cli-only";
import db from "@/db";
import { SearchResult } from "@/db/types";
import { sql } from "kysely";
import { unstable_cache } from "next/cache";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { getResumeSpecsGroupsAlerts } from "@/data/grist/specialites";
import { formatSpecialitesResumeFromGroups } from "@/utils/specialites";

export type MatchReason = {
  type: "name" | "substance" | "atc" | "pathology";
  label: string;
};

export type SearchResultItem = ResumeSpecGroup & {
  matchReasons: MatchReason[];
};

export const getSearchResults = unstable_cache(async function (
  query: string,
): Promise<SearchResultItem[]> {

  // empty query returns no results
  if (!query || query.trim().length === 0) {
    return [];
  }

  const matches = (await db
    .selectFrom("search_index")
    .selectAll()
    .select(({ fn, val }) => [
      fn("word_similarity", [fn("unaccent", [val(query)]), "token"]).as("sml"),
    ])
    .where((eb) => {
      if (query.length <= 3) {
        // for very short queries, only match from the beginning to limit the number of results
        // also, we only match specialities
        return eb.and([
          eb("token", "ilike", `${query}%`),
          eb("match_type", "=", "name"),
        ]);
      }
      if (query.length <= 5) {
        // if the query is short, we only do ilike search to avoid too many results
        return eb("token", "ilike", `%${query}%`);
      }
      return eb.or([
        sql<boolean>`token %> unaccent(${query})`, // fuzzy-search using pg_trgm
        eb("token", "ilike", `%${query}%`), // exact match using ilike
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
      // multiple subsIds resolve to the same substance name, or duplicate pathosCodes
      if (!matchGroup.reasons.some((r) => r.type === reason.type && r.label === reason.label)) {
        matchGroup.reasons.push(reason);
      }
    } else {
      groupMap.set(match.group_name, { score: match.sml, reasons: [reason] });
    }
  }

  // Keep only the top 100 groups by score to avoid oversized cache entries
  // This will also help with performance
  const groupNames = [...groupMap.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 100)
    .map(([name]) => name);
  const rawGroups = await db
    .selectFrom("resume_medicaments")
    .where("groupName", "in", groupNames)
    .selectAll()
    .execute();

  // Enrich with ATC labels + alerts
  const formatted = formatSpecialitesResumeFromGroups(rawGroups);
  const withATC = await getResumeSpecsGroupsATCLabels(formatted);
  const withAlerts = await getResumeSpecsGroupsAlerts(withATC);

  // Attach match reasons, sort by score
  return withAlerts
    .map((group) => ({
      ...group,
      matchReasons: groupMap.get(group.groupName)?.reasons ?? [],
    }))
    .sort((a, b) =>
      (groupMap.get(b.groupName)?.score ?? 0) - (groupMap.get(a.groupName)?.score ?? 0)
    );
},
  ["search-results"],
  { revalidate: 3600 } // 1 hour caching max
);
