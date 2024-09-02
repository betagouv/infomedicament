import Link from "next/link";
import { sql } from "kysely";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { pdbmMySQL, Specialite, SubstanceNom } from "@/db/pdbmMySQL";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";

import { formatSpecName, groupSpecialites } from "@/displayUtils";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";

async function getResults(query: string) {
  const specialites: Specialite[] = (
    await pdbmMySQL
      .selectFrom("Specialite")
      .where("SpecDenom01", "like", `%${query}%`)
      .selectAll()
      .execute()
  ).filter((specialite) => liste_CIS_MVP.includes(specialite.SpecId));

  const substances: SubstanceNom[] = await pdbmMySQL
    .selectFrom("Subs_Nom")
    .where(({ eb, selectFrom }) =>
      eb(
        "NomId",
        "=",
        selectFrom("Subs_Nom as subquery")
          .select("NomId")
          .whereRef("subquery.SubsId", "=", "Subs_Nom.SubsId")
          .orderBy(sql`LENGTH(Subs_Nom.NomLib)`)
          .limit(1),
      ),
    )
    .where(({ eb, selectFrom }) =>
      eb(
        "SubsId",
        "in",
        selectFrom("Composant")
          .select("SubsId")
          .where("SpecId", "in", liste_CIS_MVP),
      ),
    )
    .where("NomLib", "like", `%${query}%`)
    .selectAll()
    .execute();

  return {
    specialites,
    substances,
  };
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
          <p>
            {results.substances.length + results.specialites.length} RÉSULTATS
          </p>
          <ul>
            {results.substances.map((substance: SubstanceNom) => (
              <li key={substance.NomId} className={"fr-mb-2w"}>
                <Link href={`/substance/${substance.SubsId}`}>
                  <b>{formatSpecName(substance.NomLib)}</b>
                </Link>
                <Badge
                  className={fr.cx("fr-ml-2w", "fr-badge--purple-glycine")}
                >
                  Substance
                </Badge>
              </li>
            ))}
            {Array.from(groupSpecialites(results.specialites).entries()).map(
              ([groupName, specialites]: [string, Specialite[]]) => (
                <li key={groupName} className={"fr-mb-2w"}>
                  <b>{formatSpecName(groupName)}</b>
                  <Badge
                    className={fr.cx("fr-ml-2w", "fr-badge--green-emeraude")}
                  >
                    Médicament
                  </Badge>
                  <ul>
                    {specialites?.map((specialite) => (
                      <li key={specialite.SpecId}>
                        <Link href={`/medicament/${specialite.SpecId}`}>
                          {formatSpecName(specialite.SpecDenom01)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ),
            )}
          </ul>
        </>
      )}
    </>
  );
}
