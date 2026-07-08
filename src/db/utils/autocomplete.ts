"use server";

import "server-cli-only";
import db from "@/db";
import { formatSpecName } from "@/displayUtils";
import {
  AutocompleteSection,
  AutocompleteSuggestion,
} from "@/types/SearchTypes";
import { sql } from "kysely";
import { unstable_cache } from "next/cache";
import { getSearchMatches, getSearchResultsFromMatches } from "./search";
import { normalizeString } from "@/utils/alphabeticNav";

const AUTOCOMPLETE_MEDICINE_LIMIT = 5;
const AUTOCOMPLETE_ENTITY_LIMIT = 3;

export const getAutocompleteSuggestions = unstable_cache(
  async function (query: string): Promise<AutocompleteSection[]> {
    const matches = await getSearchMatches(query);
    if (matches.length === 0) return [];

    const searchResults = await getSearchResultsFromMatches(query, matches);

    const matchesUniqueByLabel = matches.filter(
      (match, i, arr) =>
        arr.findIndex(
          (other) =>
            other.match_label.toLowerCase() === match.match_label.toLowerCase(),
        ) === i,
    );
    const substanceLabels = matchesUniqueByLabel
      .filter((match) => match.match_type === "substance")
      .map((match) => ({
        label: match.match_label,
        score: match.sml,
      }))
      .slice(0, AUTOCOMPLETE_ENTITY_LIMIT);
    const indicationLabels = matchesUniqueByLabel
      .filter((match) => match.match_type === "indication")
      .map((match) => ({
        label: match.match_label,
        score: match.sml,
      }))
      .slice(0, AUTOCOMPLETE_ENTITY_LIMIT);

    const [substances, indications] = await Promise.all([
      substanceLabels.length > 0
        ? db
            .selectFrom("resume_substances")
            .select(["NomId", "NomLib"])
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
      substanceLabels.map(({ label, score }) => [
        normalizeString(label),
        score,
      ]),
    );
    const substanceSuggestions = substances
      .map((substance) => ({
        type: "substance" as const,
        label: substance.NomLib,
        href: `/substances/${substance.NomId}`,
        score: substanceScore.get(normalizeString(substance.NomLib)) ?? 0,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.label.localeCompare(b.label, "fr"); // alphabetical tiebreaker
      })
      .slice(0, AUTOCOMPLETE_ENTITY_LIMIT);

    const indicationScore = new Map(
      indicationLabels.map(({ label, score }) => [
        normalizeString(label),
        score,
      ]),
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

    const groupScore = new Map<string, number>();
    for (const match of matches) {
      groupScore.set(
        match.group_name,
        Math.max(groupScore.get(match.group_name) ?? 0, match.sml),
      );
    }
    const medicineSuggestions = searchResults
      .map((result) => {
        const score = groupScore.get(result.groupName) ?? result.score;

        return {
          type: "specialite" as const,
          label: formatSpecName(result.specName),
          href: `/medicaments/${result.specId}`,
          matchReasons: result.matchReasons,
          score,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.label.localeCompare(b.label, "fr"); // alphabetical tiebreaker
      })
      .slice(0, AUTOCOMPLETE_MEDICINE_LIMIT);

    return autocompleteSections(
      medicineSuggestions,
      substanceSuggestions,
      indicationSuggestions,
    );
  },
  ["autocomplete-suggestions"],
  { revalidate: 3600 },
);

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
