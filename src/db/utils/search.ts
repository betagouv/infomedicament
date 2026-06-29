"use server";

import "server-cli-only";
import db from "@/db";
import { SearchResult } from "@/db/types";
import { sql } from "kysely";
import { unstable_cache } from "next/cache";
import { getResumeSpecsATCLabels } from "@/db/utils/atc";
import { formatSpecialitesResume } from "@/utils/specialites";
import { computeSortScore } from "./searchScoring";
import { expandQuery, getSynonymMap } from "./searchSynonyms";
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

  // Expand with curated synonyms: a lay term ("mal de tête") adds its canonical
  // medical term ("céphalées") as an extra search term. Additive — no synonym match
  // leaves terms = [normalizedQuery], i.e. unchanged behaviour.
  const terms = expandQuery(normalizedQuery, await getSynonymMap());

  // Each match's similarity is the best (GREATEST) word_similarity across all terms,
  // so a synonym-driven hit scores against its canonical term, not the lay query.
  const smlExpr = sql<number>`greatest(${sql.join(
    terms.map((term) => sql`word_similarity(${term}, token)`),
  )})`;

  const matches = (await db
    .selectFrom("search_index")
    .selectAll()
    .select(smlExpr.as("sml"))
    .where((eb) => {
      // Same tiered matching as before, applied per term and OR-ed together.
      const termPredicate = (term: string) => {
        if (term.length <= 3) {
          // for very short queries, only match from the beginning to limit the number of results
          // also, we only match specialities
          return eb.and([
            eb("token", "like", `${term}%`),
            eb("match_type", "=", "name"),
          ]);
        }
        if (term.length <= 5) {
          // if the query is short, we only do ilike search to avoid too many results
          return eb("token", "like", `%${term}%`);
        }
        return eb.or([
          sql<boolean>`token %> ${term}`, // fuzzy-search using pg_trgm
          eb("token", "like", `%${term}%`), // exact match
        ]);
      };
      return eb.or(terms.map(termPredicate));
    })
    .orderBy("sml", "desc")
    .orderBy(({ fn }) => fn("length", ["token"]))
    .execute()) as (SearchResult & { sml: number })[];

  if (matches.length === 0) return [];

  // Group by group_name to deduplicate, collect best score + match reasons
  const groupMap = new Map<string, { score: number; reasons: MatchReason[] }>();
  // Per-spécialité name similarity: best sml of a "name" token attributed to a specId.
  // Lets us rank variants within a group (e.g. "Doliprane 1000" above "Doliprane 500").
  const specNameSml = new Map<string, number>();
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
    if (match.match_type === "name" && match.spec_id) {
      specNameSml.set(match.spec_id, Math.max(specNameSml.get(match.spec_id) ?? 0, match.sml));
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

  // Attach match reasons, score per spécialité, sort, cap output at 200 to keep cache entries bounded
  return withATC
    .map((spec) => {
      const matchReasons = groupMap.get(spec.groupName)?.reasons ?? [];
      // Prefer this spécialité's own name similarity so variants rank against the query
      // individually; fall back to the group's best score for substance/atc/indication matches.
      const baseSml = specNameSml.get(spec.specId) ?? groupMap.get(spec.groupName)?.score ?? 0;
      return {
        ...spec,
        matchReasons,
        score: computeSortScore(query, spec.specName, spec.composants, matchReasons, baseSml),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.specName.localeCompare(b.specName, "fr"); // alphabetical tiebreaker
    })
    .slice(0, 200);
},
  ["search-results"],
  { revalidate: 3600 } // 1 hour caching max
);
