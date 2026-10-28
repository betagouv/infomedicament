import "server-cli-only";
import type { SearchResult } from "@/db/types";
import type { MatchReason } from "@/types/SearchTypes";

export type SearchIndexMatch = SearchResult & {
  sml: number;
};

type GroupMatch = {
  score: number;
  reasons: MatchReason[];
};

export function groupMatches(matches: SearchIndexMatch[]) {
  if (matches.length === 0) return undefined;

  // Group by group_name to deduplicate, collect best score + match reasons
  const groupMap = new Map<string, GroupMatch>();
  const reasonKeysByGroup = new Map<string, Set<string>>();
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
      const reasonKey = JSON.stringify([reason.type, reason.label]);
      const reasonKeys = reasonKeysByGroup.get(match.group_name)!;
      if (!reasonKeys.has(reasonKey)) {
        reasonKeys.add(reasonKey);
        matchGroup.reasons.push(reason);
      }
    } else {
      reasonKeysByGroup.set(match.group_name, new Set([JSON.stringify([reason.type, reason.label])]));
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

// Both projections use the same candidate pool before their own ranking.
export function getCandidateGroupNames(groupMap: Map<string, GroupMatch>): string[] {
  return [...groupMap.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 500)
    .map(([name]) => name);
}
