import Link from "next/link";
import { sql } from "kysely";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { pdbmMySQL, Specialite, SubstanceNom } from "@/db/pdbmMySQL";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import db, { SearchResult } from "@/db";

import { formatSpecName, groupSpecialites } from "@/displayUtils";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";

type SearchResultItem =
  | SubstanceNom
  | { groupName: string; specialites: Specialite[] };

async function getSpecialites(specialitesId: string[], substancesId: string[]) {
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
        .where("Specialite.SpecId", "in", liste_CIS_MVP)
        .selectAll("Specialite")
        .select(({ fn }) => [
          fn<Array<string>>("json_arrayagg", ["NomId"]).as("SubsNomId"),
        ])
        .groupBy("Specialite.SpecId")
        .execute()
    : [];
}

async function getSubstances(substancesId: string[]) {
  const substances: SubstanceNom[] = substancesId.length
    ? await pdbmMySQL
        .selectFrom("Subs_Nom")
        .where("NomId", "in", substancesId)
        .where(({ eb, selectFrom }) =>
          eb(
            "NomId",
            "in",
            selectFrom("Composant")
              .select("NomId")
              .where("SpecId", "in", liste_CIS_MVP),
          ),
        )
        .selectAll()
        .execute()
    : [];
  return substances;
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
async function getResults(query: string): Promise<SearchResultItem[]> {
  const dbQuery = db
    .selectFrom("search_index")
    .selectAll()
    .select(({ fn, val }) => [
      fn("word_similarity", [val(query), "token"]).as("sml"),
    ])
    .where("token", sql`%>`, query)
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

  const specialites = await getSpecialites(specialitesId, substancesId);
  const specialiteGroups = Array.from(groupSpecialites(specialites).entries());
  const substances = await getSubstances(substancesId);

  return matches
    .reduce((acc: { score: number; item: SearchResultItem }[], match) => {
      if (match.table_name === "Subs_Nom") {
        const substance = substances.find(
          (s) => s.NomId.trim() === match.id.trim(),
        ); // if undefined, the substance is not in one of the 500 CIS list
        if (substance) {
          acc.push({ score: match.sml, item: substance });

          specialiteGroups
            .filter(([, specialites]) =>
              specialites.find(
                (s) =>
                  s.SubsNomId && s.SubsNomId.includes(substance.NomId.trim()),
              ),
            )
            .forEach(([groupName, specialites]) => {
              if (
                !acc.find((a) => "groupName" in a && a.groupName === groupName)
              ) {
                let directMatch = matches.find(
                  (m) =>
                    m.table_name === "Specialite" &&
                    specialites.find((s) => s.SpecId.trim() === m.id.trim()),
                );
                acc.push({
                  score: directMatch ? directMatch.sml + match.sml : match.sml,
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
          acc.push({ score: match.sml, item: { groupName, specialites } });
        }
      }

      return acc;
    }, [])
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const results = search && (await getResults(searchParams["s"]));

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          {" "}
          <form action="/rechercher" className={fr.cx("fr-my-4w")}>
            <Input
              label={"Quel médicament cherchez-vous&nbsp;?"}
              hideLabel={true}
              addon={
                <Button iconId={"fr-icon-search-line"} title="Recherche" />
              }
              nativeInputProps={{
                name: "s",
                placeholder: "Rechercher",
                ...(search ? { defaultValue: search } : {}),
                type: "search",
              }}
            />
          </form>
        </div>
      </div>
      {results && (
        <>
          <p>{results.length} RÉSULTATS</p>
          <ul>
            {results.map((result, index) => (
              <li key={index} className={"fr-mb-2w"}>
                {"NomLib" in result ? (
                  <>
                    <Link href={`/substance/${result.NomId}`}>
                      <b>{formatSpecName(result.NomLib)}</b>
                    </Link>
                    <Badge
                      className={fr.cx("fr-ml-2w", "fr-badge--purple-glycine")}
                    >
                      Substance
                    </Badge>
                  </>
                ) : (
                  <>
                    <b>{formatSpecName(result.groupName)}</b>
                    <Badge
                      className={fr.cx("fr-ml-2w", "fr-badge--green-emeraude")}
                    >
                      Médicament
                    </Badge>
                    <ul>
                      {result.specialites?.map((specialite) => (
                        <li key={specialite.SpecId}>
                          <Link href={`/medicament/${specialite.SpecId}`}>
                            {formatSpecName(specialite.SpecDenom01)
                              .replace(
                                `${formatSpecName(result.groupName)}, `,
                                "",
                              )
                              .replace(formatSpecName(result.groupName), "")}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
