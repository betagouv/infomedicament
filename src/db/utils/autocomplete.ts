"use server";

import "server-cli-only";
import db from "@/db";
import { formatSpecName } from "@/displayUtils";
import {
  AutocompleteSection,
  AutocompleteSuggestion,
} from "@/types/SearchTypes";
import { sql } from "kysely";
import { getSearchMatches } from "./search";
import {
  groupMatches,
  getCandidateGroupNames,
  type SearchIndexMatch,
} from "./searchGrouping";
import { computeSortScore } from "./searchScoring";
import { autocompleteQuerySchema } from "@/schemas/autocomplete";
import { normalizeString } from "@/utils/alphabeticNav";

const AUTOCOMPLETE_MEDICINE_LIMIT = 5;
const AUTOCOMPLETE_ENTITY_LIMIT = 3;

function getEntityLabels(
  matches: SearchIndexMatch[],
  type: "substance" | "indication",
) {
  const labels = new Map<string, { label: string; score: number }>();
  for (const match of matches) {
    if (match.match_type !== type) continue;
    const key = normalizeString(match.match_label);
    const existing = labels.get(key);
    if (!existing || match.sml > existing.score) {
      labels.set(key, { label: match.match_label, score: match.sml });
    }
  }
  return [...labels.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, AUTOCOMPLETE_ENTITY_LIMIT);
}

async function getMedicineSuggestions(
  query: string,
  matches: SearchIndexMatch[],
): Promise<AutocompleteSuggestion[]> {
  const grouped = groupMatches(matches);
  if (!grouped) return [];
  const { groupMap, specNameSml } = grouped;
  const rows = await db
    .selectFrom("resume_specialites")
    .where("groupName", "in", getCandidateGroupNames(groupMap))
    .select(["specId", "specName", "groupName", "composants"])
    .execute();

  return rows
    .map((spec) => ({
      spec,
      suggestion: {
        type: "specialite" as const,
        label: formatSpecName(spec.specName),
        href: `/medicaments/${spec.specId}`,
        matchReasons: groupMap.get(spec.groupName)?.reasons ?? [],
        score: groupMap.get(spec.groupName)?.score ?? 0,
      },
    }))
    .sort((a, b) => {
      const rank =
        b.suggestion.score - a.suggestion.score ||
        a.suggestion.label.localeCompare(b.suggestion.label, "fr");
      if (rank !== 0) return rank;
      // The old projection inherited full-search order when formatted labels tied.
      // Only those ties need its scoring; ordinary suggestions skip it entirely.
      const tieScore = (entry: typeof a) =>
        computeSortScore(
          query,
          entry.spec.specName,
          entry.spec.composants,
          entry.suggestion.matchReasons,
          specNameSml.get(entry.spec.specId) ?? entry.suggestion.score,
        );
      return (
        tieScore(b) - tieScore(a) ||
        a.spec.specName.localeCompare(b.spec.specName, "fr")
      );
    })
    .slice(0, AUTOCOMPLETE_MEDICINE_LIMIT)
    .map(({ suggestion }) => suggestion);
}

export async function getAutocompleteSuggestions(
  query: string,
): Promise<AutocompleteSection[]> {
  if (!query.trim()) return [];
  return getCachedAutocompleteSuggestions(autocompleteQuerySchema.parse(query));
}

async function getCachedAutocompleteSuggestions(
  query: string,
): Promise<AutocompleteSection[]> {
  "use cache: remote";
  const matches = await getSearchMatches(query);
  if (matches.length === 0) return [];

  const substanceLabels = getEntityLabels(matches, "substance");
  const indicationLabels = getEntityLabels(matches, "indication");

  const [medicineSuggestions, substances, indications] = await Promise.all([
    getMedicineSuggestions(query, matches),
    substanceLabels.length > 0
      ? db
          .selectFrom("resume_substances")
          .select(["SubsId", "NomLib"])
          .where(({ eb, ref }) =>
            eb(
              sql<string>`lower(unaccent(${ref("NomLib")}))`,
              "in",
              substanceLabels.map((substance) =>
                normalizeString(substance.label),
              ),
            ),
          )
          .execute()
      : Promise.resolve([]),
    indicationLabels.length > 0
      ? db
          .selectFrom("resume_indications")
          .select(["idIndication", "nomIndication"])
          .where(({ eb, ref }) =>
            eb(
              sql<string>`lower(unaccent(${ref("nomIndication")}))`,
              "in",
              indicationLabels.map((indication) =>
                normalizeString(indication.label),
              ),
            ),
          )
          .execute()
      : Promise.resolve([]),
  ]);

  const substanceScore = new Map(
    substanceLabels.map(({ label, score }) => [normalizeString(label), score]),
  );
  const substanceSuggestions = substances
    .map((substance) => ({
      type: "substance" as const,
      label: substance.NomLib,
      href: `/substances/${substance.SubsId}`,
      score: substanceScore.get(normalizeString(substance.NomLib)) ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label, "fr"); // alphabetical tiebreaker
    })
    .slice(0, AUTOCOMPLETE_ENTITY_LIMIT);

  const indicationScore = new Map(
    indicationLabels.map(({ label, score }) => [normalizeString(label), score]),
  );
  const indicationSuggestions = indications
    .map((indication) => ({
      type: "indication" as const,
      label: indication.nomIndication,
      href: `/indications/${indication.idIndication}`,
      score:
        indicationScore.get(normalizeString(indication.nomIndication)) ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.label.localeCompare(b.label, "fr"); // alphabetical tiebreaker
    })
    .slice(0, AUTOCOMPLETE_ENTITY_LIMIT);

  return autocompleteSections(
    medicineSuggestions,
    substanceSuggestions,
    indicationSuggestions,
  );
}

function autocompleteSections(
  medicines: AutocompleteSuggestion[],
  substances: AutocompleteSuggestion[],
  indications: AutocompleteSuggestion[],
): AutocompleteSection[] {
  const sections: AutocompleteSection[] = [
    medicines.length > 0 && {
      type: "specialite",
      title: "Médicaments",
      highestScore: medicines[0].score,
      items: medicines,
    },
    substances.length > 0 && {
      type: "substance",
      title: "Substances actives",
      highestScore: substances[0].score,
      items: substances,
    },
    indications.length > 0 && {
      type: "indication",
      title: "Indications",
      highestScore: indications[0].score,
      items: indications,
    },
  ].filter((section): section is AutocompleteSection => Boolean(section));

  return sections.sort((a, b) => {
    if (b.highestScore !== a.highestScore)
      return b.highestScore - a.highestScore;

    // In case of a tie, sort by type priority: specialite > substance > indication
    const order = ["specialite", "substance", "indication"];
    return order.indexOf(a.type) - order.indexOf(b.type);
  });
}
