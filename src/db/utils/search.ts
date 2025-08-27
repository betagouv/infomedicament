import "server-cli-only";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import db from "@/db";
import { SearchResult } from "@/db/types";
import { Expression, expressionBuilder, sql, SqlBool } from "kysely";
import { groupSpecialites, presentationIsComm } from "@/db/utils/index";
import { Patho, PdbmMySQL, Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { unstable_cache } from "next/cache";
import { ATC, ATC1, getAtc1, getAtc2 } from "@/data/grist/atc";

export type SearchResultItem =
  | SubstanceNom
  | { groupName: string; specialites: Specialite[] }
  | Patho
  | { class: ATC1; subclasses: ATC[] };

const getSpecialites = unstable_cache(async function (
  specialitesId: string[],
  substancesId: string[],
) {
  return specialitesId.length
    ? await pdbmMySQL
        .selectFrom("Specialite")
        .leftJoin("Composant", "Specialite.SpecId", "Composant.SpecId")
        .where(({ eb }) =>
          substancesId.length
            ? eb.or([
                eb("Specialite.SpecId", "in", specialitesId),
                eb("Composant.NomId", "in", substancesId),
              ])
            : eb("Specialite.SpecId", "in", specialitesId),
        )
        .leftJoin("Presentation", "Specialite.SpecId", "Presentation.SpecId")
        //.where(presentationIsComm())
        .where("Specialite.SpecId", "in", liste_CIS_MVP)
        .selectAll("Specialite")
        .select(({ fn }) => [
          fn<Array<string>>("json_arrayagg", ["NomId"]).as("SubsNomId"),
        ])
        .groupBy("Specialite.SpecId")
        .execute()
    : [];
});

//TODO quand base maj ajouter ces calcules dans getSubstances - doublon
function withSubstances(
  specId: Expression<string>,
  nomIds: string[],
): Expression<SqlBool> {
  const eb = expressionBuilder<PdbmMySQL, never>();

  return eb.exists(
    eb
      .selectFrom("Composant")
      .select("Composant.SpecId")
      .where("Composant.NomId", "in", nomIds)
      .where("Composant.SpecId", "=", specId)
      .where(({ eb, selectFrom }) =>
        eb(
          "Composant.SpecId",
          "not in",
          selectFrom("Composant as subquery")
            .select("SpecId")
            .where("subquery.NomId", "not in", nomIds)
            .whereRef(
              "subquery.CompNum",
              "not in",
              selectFrom("Composant as subquery2")
                .select("CompNum")
                .where("subquery2.SpecId", "=", specId)
                .where("subquery2.NomId", "in", nomIds),
            ),
        ),
      )
      .groupBy("Composant.SpecId")
      .having((eb) =>
        eb(
          eb.fn.count("Composant.CompNum").distinct(),
          "=",
          eb.val(nomIds.length),
        ),
      ),
  );
}

const getSubstances = unstable_cache(async function getSubstances(
  substancesId: string[],
) {
  const substances: SubstanceNom[] = substancesId.length
    ? await pdbmMySQL
        .selectFrom("Subs_Nom")
        .where("NomId", "in", substancesId)
        .selectAll()
        .execute()
    : [];
  return substances;
});

export const getSubstanceSpecialites = unstable_cache(async function (
  substanceIDs: (string | string[])
): Promise<Specialite[]> {
  const ids: string[] = !Array.isArray(substanceIDs) ? [substanceIDs] : substanceIDs;
  return pdbmMySQL
  .selectFrom("Specialite")
  .selectAll("Specialite")
  .where((eb) => withSubstances(eb.ref("Specialite.SpecId"), ids))
  .where("Specialite.SpecId", "in", liste_CIS_MVP)
  .groupBy("Specialite.SpecId")
  .execute();
});

//TODO quand base maj ajouter tous les calculs ici
const getPathologies = unstable_cache(async function (pathologiesId: string[]) {
  return pathologiesId.length
    ? await pdbmMySQL
        .selectFrom("Patho")
        .selectAll()
        .where("codePatho", "in", pathologiesId)
        .execute()
    : [];
});

function getSearchScore(
  query: string, 
  match: SearchResult & {sml: number},
  specFromSub?: boolean,
): number {
  const cleanQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cleanToken = match.token.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const indexOf = cleanToken.toLowerCase().indexOf(cleanQuery);

  let score: number = match.sml;
  if(match.sml === 1){
    //Mot entier non contenu dans un autre
    if(indexOf !== 0) score -= 0.01; //Pas en début de phrase
  } else {
    if(indexOf !== -1){
      if(indexOf === 0) score -= 0.02;
      else score -= 0.03;

    } else {
      if(specFromSub){
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

  const dbQuery = db
    .selectFrom("search_index")
    .selectAll()
    .select(({ fn, val }) => [
      fn("word_similarity", [fn("unaccent", [val(query)]), "token"]).as("sml"),
    ])
    .where(
      query.length > 2 // if the query is too short, we don't do ilike search to avoid too many results
        ? ({ eb }) =>
            eb.or([
              sql<boolean>`token %> unaccent(${query})`,
              eb("token", "ilike", `%${query}%`),
            ])
        : sql<boolean>`token %> unaccent(${query})`,
    )
    .orderBy("sml", "desc")
    .orderBy(({ fn }) => fn("length", ["token"]));

  const matches = (await dbQuery.execute()) as (SearchResult & {
    sml: number;
  })[];

  if (matches.length === 0) return [];

  const specialitesId = matches
    .filter((r) => r.table_name === "Specialite")
    .map((r) => r.id);
  const substancesId = matches
    .filter((r) => r.table_name === "Subs_Nom")
    .map((r) => r.id);
  const pathologiesId = matches
    .filter((r) => r.table_name === "Patho")
    .map((r) => r.id);
  const ATCCodes = matches
    .filter((r) => r.table_name === "ATC")
    .map((r) => r.id);

  const specialites = await getSpecialites(specialitesId, substancesId);
  const specialiteGroups = groupSpecialites(specialites);
  const substances = await getSubstances(substancesId);
  const pathologies = await getPathologies(pathologiesId);
  const ATCClasses = await Promise.all(
    ATCCodes.map((code) => (code.length === 1 ? getAtc1(code) : getAtc2(code))),
  );

  const acc: { score: number; item: SearchResultItem }[] = [];
  for (const match of matches) {
    if (match.table_name === "Subs_Nom") {
      const substance = substances.find(
        (s) => s.NomId.trim() === match.id.trim(),
      ); // if undefined, the substance is not in one of the 500 CIS list
      if (substance) {
        acc.push({ score: getSearchScore(query, match), item: substance });

        if (onlyDirectMatches) continue;

        specialiteGroups
          .filter(([, specialites]) =>
            specialites.find(
              (s) =>
                s.SubsNomId &&
                s.SubsNomId.map((id) => id.trim()).includes(
                  substance.NomId.trim(),
                ),
            ),
          )
          .forEach(([groupName, specialites]) => {
            if (
              !acc.find(
                ({ item }) =>
                  "groupName" in item && item.groupName === groupName,
              )
            ) {
              let directMatch = matches.find(
                (m) =>
                  m.table_name === "Specialite" &&
                  specialites.find((s) => s.SpecId.trim() === m.id.trim()),
              );
              //Avant : directMatch ? directMatch.sml + match.sml : match.sml
              //Si vient de substance, on fait passer en avant
              acc.push({
                score: directMatch ? getSearchScore(query, directMatch, true) : 0.3,
                item: { groupName, specialites },
              });
            }
          });
      }
    }

    if (match.table_name === "Specialite") {
      const specialiteGroup = specialiteGroups.find(([, specialites]) =>
        specialites.find((s) => s.SpecId.trim() === match.id.trim()),
      ); // if undefined, the specialite is not in the 500 CIS list
      if (
        specialiteGroup &&
        !acc.find(
          ({ item }) =>
            "groupName" in item && item.groupName === specialiteGroup[0],
        )
      ) {
        const [groupName, specialites] = specialiteGroup;
        acc.push({ score: getSearchScore(query, match), item: { groupName, specialites } });
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
      (a, b) => 
        { 
          if(a.score !== b.score ) return 1;
          else {
            const valA: string = (a.item as SubstanceNom).NomLib 
              ? (a.item as SubstanceNom).NomLib
              : (a.item as Patho).NomPatho
                ? (a.item as Patho).NomPatho
                : (a.item as { class: ATC1; subclasses: ATC[] }).class && (a.item as { class: ATC1; subclasses: ATC[] }).class.label
                  ? (a.item as { class: ATC1; subclasses: ATC[] }).class.label
                  : (a.item as { groupName: string; specialites: Specialite[] }).groupName
                    ? (a.item as { groupName: string; specialites: Specialite[] }).groupName
                    : "";
            const valB: string = (b.item as SubstanceNom).NomLib 
              ? (b.item as SubstanceNom).NomLib
              : (b.item as Patho).NomPatho
                ? (b.item as Patho).NomPatho
                : (b.item as { class: ATC1; subclasses: ATC[] }).class && (b.item as { class: ATC1; subclasses: ATC[] }).class.label
                  ? (b.item as { class: ATC1; subclasses: ATC[] }).class.label
                  : (b.item as { groupName: string; specialites: Specialite[] }).groupName
                    ? (b.item as { groupName: string; specialites: Specialite[] }).groupName
                    : "";
            return valA.localeCompare(valB);
          }
        }
    ).map(({ item }) => item);
});