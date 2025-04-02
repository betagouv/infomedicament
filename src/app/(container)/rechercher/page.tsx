import { Fragment } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

import { Patho, SubstanceNom } from "@/db/pdbmMySQL/types";
import { getSearchResults } from "@/db/utils";
import { formatSpecName } from "@/displayUtils";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import MedGroupSpecList from "@/components/MedGroupSpecList";
import { ATC, ATC1 } from "@/data/grist/atc";
import ContentContainer from "@/components/newGenericContent/ContentContainer";

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

const PathoResult = ({ item }: { item: Patho }) => (
  <li className={fr.cx("fr-mb-3w")}>
    <i className={fr.cx("fr-icon--sm", "fr-mr-1w", "fr-icon-lungs-fill")} />
    <Link
      href={`/pathologies/${item.codePatho}`}
      className={fr.cx("fr-text--md", "fr-text--bold", "fr-link")}
    >
      {formatSpecName(item.NomPatho)}
    </Link>
  </li>
);

const ATCClassResult = ({
  item,
}: {
  item: { class: ATC1; subclasses: ATC[] };
}) => (
  <li className={fr.cx("fr-mb-3w")}>
    <Link
      href={`/atc/${item.class.code}`}
      className={fr.cx("fr-text--md", "fr-text--bold", "fr-link")}
    >
      {formatSpecName(item.class.label)}
    </Link>
    {item.subclasses.map((subclass, index) => (
      <Fragment key={index}>
        <ul className={fr.cx("fr-raw-list", "fr-pl-3w")}>
          <li className={fr.cx("fr-mb-1v")}>
            <Link
              href={`/atc/${subclass.code}`}
              className={fr.cx("fr-text--sm", "fr-link")}
            >
              {formatSpecName(subclass.label)}
            </Link>
          </li>
        </ul>
      </Fragment>
    ))}
  </li>
);

export default async function Page(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const search = searchParams && "s" in searchParams && searchParams["s"];
  const results = search && (await getSearchResults(searchParams["s"]));

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
          <h1
            className={fr.cx(
              "fr-h5",
              "fr-mb-4w",
              "fr-hidden",
              "fr-unhidden-lg",
            )}
          >
            Résultats de recherche
          </h1>{" "}
          <form
            action="/rechercher"
            className={fr.cx("fr-my-4w", "fr-hidden-lg")}
          >
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
                  ) : "groupName" in result ? (
                    <MedGroupSpecList
                      medGroup={[result.groupName, result.specialites]}
                      className={fr.cx("fr-mb-3w")}
                    />
                  ) : "NomPatho" in result ? (
                    <PathoResult item={result} />
                  ) : (
                    <ATCClassResult item={result} />
                  )}
                </Fragment>
              ))}
            </ul>
          </div>
        </div>
      )}
    </ContentContainer>
  );
}
