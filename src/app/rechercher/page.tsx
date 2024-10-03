import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";

import { formatSpecName } from "@/displayUtils";
import { getResults } from "@/db/search";
import AutocompleteSearch from "@/components/AutocompleteSearch";

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
            <AutocompleteSearch />
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
