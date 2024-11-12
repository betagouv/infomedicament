import { Fragment } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { getResults } from "@/db/search";
import { formatSpecName } from "@/displayUtils";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import MedGroupSpecList from "@/components/MedGroupSpecList";

const SubstanceResult = ({ item }: { item: SubstanceNom }) => (
  <li className={fr.cx("fr-mb-3w")}>
    <i
      className={cx(
        "fr-icon--custom-molecule",
        fr.cx("fr-icon--sm", "fr-mr-1w"),
      )}
    />
    <Link
      href={`/substances/${item.NomId}`}
      className={fr.cx("fr-text--md", "fr-text--bold", "fr-link")}
    >
      {formatSpecName(item.NomLib)}
    </Link>
  </li>
);

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
            <AutocompleteSearch
              inputName="s"
              initialValue={search || undefined}
            />
          </form>
        </div>
      </div>
      {results && (
        <div className={fr.cx("fr-grid-row")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            <ul className={fr.cx("fr-raw-list")}>
              {results.map((result, index) => (
                <Fragment key={index}>
                  {"NomLib" in result ? (
                    <SubstanceResult item={result} />
                  ) : (
                    <MedGroupSpecList
                      key={index}
                      medGroup={[result.groupName, result.specialites]}
                      className={fr.cx("fr-mb-3w")}
                    />
                  )}
                </Fragment>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
