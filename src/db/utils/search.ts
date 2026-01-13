"use server";

import "server-cli-only";
import db from "@/db";
import { ResumePatho, ResumeSubstance, SearchResult } from "@/db/types";
import { sql } from "kysely";
import { unstable_cache } from "next/cache";
import { getAtc1, getAtc2, getResumeSpecsGroupsATCLabels } from "@/data/grist/atc";
import { ATC, ATC1 } from "@/types/ATCTypes";
import { getSubstancesResume } from "./substances";
import { getPathologiesResume } from "./pathologies";
import { getResumeSpecsGroupsWithCISSubsIds } from "./specialities";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { getResumeSpecsGroupsAlerts } from "@/data/grist/specialites";

export type SearchResultItem =
  | ResumeSubstance
  | ResumeSpecGroup
  | ResumePatho
  | { class: ATC1; subclasses: ATC[] };

function getSearchScore(
  query: string,
  match: SearchResult & { sml: number },
  specFromSub?: boolean,
): number {
  const cleanQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cleanToken = match.token.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const indexOf = cleanToken.toLowerCase().indexOf(cleanQuery);

  let score: number = match.sml;
  if (match.sml === 1) {
    //Mot entier non contenu dans un autre
    if (indexOf !== 0) score -= 0.01; //Pas en début de phrase
  } else {
    if (indexOf !== -1) {
      if (indexOf === 0) score -= 0.02;
      else score -= 0.03;

    } else {
      if (specFromSub) {
        score -= 0.03;
      }
      else score -= 0.04; //Pas trouvé : faute d'orthographe
    }
  }
  return score;
}

/**
 * Get search results from the database
 *
 * The search results are generated and ordered by the following rules:
 * 1. We get all substances and specialites matches from the search_index table
 * 2. We retrieve all substances, all direct match for specialities,
 *    and all specialities that have a match with a substance
 * 3. We group the specialities by their group name
 * 4. The score of each result is the word similarity between the search query and the token,
 *    for specialities, we sum direct match score and substance match score
 */
export const getSearchResults = unstable_cache(async function (
  query: string,
  { onlyDirectMatches = false } = {},
): Promise<SearchResultItem[]> {

  // empty query returns no results
  if (!query || query.trim().length === 0) {
    return [];
  }

  const dbQuery = db
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
          eb("table_name", "in", ["Specialite"])
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

  const matches = (await dbQuery.execute()) as (SearchResult & {
    sml: number;
  })[];

  if (matches.length === 0) return [];

  const specialitesId = matches
    .filter((r) => r.table_name === "Specialite")
    .map((r) => r.id.trim());
  const substancesId = matches
    .filter((r) => r.table_name === "Subs_Nom")
    .map((r) => r.id.trim());
  const pathologiesId = matches
    .filter((r) => r.table_name === "Patho")
    .map((r) => r.id.trim());
  const ATCCodes = matches
    .filter((r) => r.table_name === "ATC")
    .map((r) => r.id.trim());

  const resumeSpecsGroups = await getResumeSpecsGroupsWithCISSubsIds(specialitesId, substancesId);
  const specsGroupsWithATC: ResumeSpecGroup[] = await getResumeSpecsGroupsATCLabels(resumeSpecsGroups);
  const specsGroups: ResumeSpecGroup[] = await getResumeSpecsGroupsAlerts(specsGroupsWithATC);
  const substances = await getSubstancesResume(substancesId);
  const pathologies = await getPathologiesResume(pathologiesId);
  const ATCClasses = await Promise.all(
    ATCCodes.map((code) => (code.length === 1 ? getAtc1(code) : getAtc2(code))),
  );

  const acc: { score: number; item: SearchResultItem }[] = [];
  for (const match of matches) {
    if (match.table_name === "Subs_Nom") {
      const substance = substances.find(
        (s) => s.NomId.trim() === match.id.trim(),
      );
      if (substance) {
        acc.push({ score: getSearchScore(query, match), item: substance });

        if (onlyDirectMatches) continue;

        specsGroups
          .filter((specGroup) =>
            specGroup.subsIds.find(
              (subsId) => subsId === substance.NomId.trim(),
            ),
          )
          .forEach((specGroup) => {
            if (
              !acc.find(
                ({ item }) =>
                  "groupName" in item && item.groupName === specGroup.groupName,
              )
            ) {
              let directMatch = matches.find(
                (m) =>
                  m.table_name === "Specialite" &&
                  specGroup.CISList.find((CIS) => CIS.trim() === m.id.trim()),
              );
              //Avant : directMatch ? directMatch.sml + match.sml : match.sml
              //Si vient de substance, on fait passer en avant
              acc.push({
                score: directMatch ? getSearchScore(query, directMatch, true) : 0.3,
                item: specGroup,
              });
            }
          });
      }
    }

    if (match.table_name === "Specialite") {
      const specialiteGroup = specsGroups.find((specGroup) => specGroup.CISList.includes(match.id.trim()));
      if (
        specialiteGroup &&
        !acc.find(
          ({ item }) =>
            "groupName" in item && item.groupName === specialiteGroup.groupName,
        )
      ) {
        acc.push({ score: getSearchScore(query, match), item: specialiteGroup });
      }
    }

    if (match.table_name === "Patho") {
      const patho = pathologies.find(
        (p) => p.codePatho.trim() === match.id.trim(),
      );
      if (patho) {
        acc.push({ score: getSearchScore(query, match), item: patho });
      }
    }

    if (match.table_name === "ATC") {
      const atc = ATCClasses.find((atc) => atc.code.trim() === match.id.trim());
      if (atc) {
        const sameClass = acc.find(
          ({ item }) =>
            "class" in item &&
            item.class.code.slice(0, 1) === atc.code.slice(0, 1),
        );

        if (sameClass && atc.code.length === 1) continue;

        if (sameClass && "subclasses" in sameClass.item) {
          sameClass.item.subclasses.push(atc);
          sameClass.score = Math.max(match.sml, sameClass.score);
        } else {
          if (atc.code.length === 1) {
            acc.push({
              score: match.sml,
              item: { class: atc as ATC1, subclasses: [] },
            });
          } else {
            acc.push({
              score: match.sml,
              item: { class: await getAtc1(atc.code), subclasses: [atc] },
            });
          }
        }
      }
    }
  }
  return acc
    .sort((a, b) => b.score - a.score)
    .sort(
      (a, b) => {
        if (a.score !== b.score) return 1;
        else {
          const valA: string = (a.item as ResumeSubstance).NomLib
            ? (a.item as ResumeSubstance).NomLib
            : (a.item as ResumePatho).NomPatho
              ? (a.item as ResumePatho).NomPatho
              : (a.item as { class: ATC1; subclasses: ATC[] }).class && (a.item as { class: ATC1; subclasses: ATC[] }).class.label
                ? (a.item as { class: ATC1; subclasses: ATC[] }).class.label
                : (a.item as ResumeSpecGroup).groupName
                  ? (a.item as ResumeSpecGroup).groupName
                  : "";
          const valB: string = (b.item as ResumeSubstance).NomLib
            ? (b.item as ResumeSubstance).NomLib
            : (b.item as ResumePatho).NomPatho
              ? (b.item as ResumePatho).NomPatho
              : (b.item as { class: ATC1; subclasses: ATC[] }).class && (b.item as { class: ATC1; subclasses: ATC[] }).class.label
                ? (b.item as { class: ATC1; subclasses: ATC[] }).class.label
                : (b.item as ResumeSpecGroup).groupName
                  ? (b.item as ResumeSpecGroup).groupName
                  : "";
          return valA.localeCompare(valB);
        }
      }
    ).map(({ item }) => item);
});