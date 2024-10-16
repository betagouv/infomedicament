import path from "node:path";
import { readFileSync } from "node:fs";
import { Fragment } from "react";
import { parse as csvParse } from "csv-parse/sync";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";

import { Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { getAtcLabels } from "@/data/atc";
import { getResults } from "@/db/search";
import { formatSpecName } from "@/displayUtils";
import AutocompleteSearch from "@/components/AutocompleteSearch";

const atcData = csvParse(
  readFileSync(
    path.join(process.cwd(), "src", "data", "CIS-ATC_2024-04-07.csv"),
  ),
) as string[][];
function getAtc(CIS: string) {
  const atc = atcData.find((row) => row[0] === CIS);
  return atc ? atc[1] : null;
}

const SubstanceResult = ({ item }: { item: SubstanceNom }) => (
  <li className={fr.cx("fr-mb-3w")}>
    <i
      className={cx(
        "fr-icon--custom-molecule",
        fr.cx("fr-icon--sm", "fr-mr-1w"),
      )}
    />
    <Link
      href={`/substance/${item.NomId}`}
      className={fr.cx("fr-text--md", "fr-text--bold", "fr-link")}
    >
      {formatSpecName(item.NomLib)}
    </Link>
  </li>
);

const MedicamentGroupResult = async ({
  item,
}: {
  item: { groupName: string; specialites: Specialite[] };
}) => {
  const atc = getAtc(item.specialites[0].SpecId);
  const atcLabels = atc ? await getAtcLabels(atc) : null;
  const [, subClass, substance] = atcLabels ? atcLabels : [null, null, null];
  return (
    <li className={fr.cx("fr-mb-3w")}>
      <div>
        <div className={fr.cx("fr-mb-1v")}>
          <span className={fr.cx("fr-text--md", "fr-text--bold")}>
            {formatSpecName(item.groupName)}
          </span>
        </div>
        <div className={fr.cx("fr-grid-row")} style={{ flexWrap: "nowrap" }}>
          <div className={"fr-mr-1w"}>
            <i className={cx("fr-icon--custom-pill", fr.cx("fr-icon--sm"))} />
          </div>
          <ul className={fr.cx("fr-tags-group", "fr-mb-n1v")}>
            {subClass && (
              <Tag
                small
                nativeButtonProps={{
                  className: fr.cx("fr-tag--yellow-tournesol"),
                }}
              >
                {subClass}
              </Tag>
            )}
            {substance && (
              <Tag
                small
                nativeButtonProps={{
                  className: fr.cx("fr-tag--purple-glycine"),
                }}
              >
                {substance}
              </Tag>
            )}
          </ul>
        </div>
      </div>
      <ul className={fr.cx("fr-raw-list", "fr-pl-3w")}>
        {item.specialites?.map((specialite, i) => (
          <li key={i} className={fr.cx("fr-mb-1v")}>
            <Link
              href={`/medicament/${specialite.SpecId}`}
              className={fr.cx("fr-text--sm", "fr-link")}
            >
              {formatSpecName(specialite.SpecDenom01)
                .replace(`${formatSpecName(item.groupName)}, `, "")
                .replace(formatSpecName(item.groupName), "")}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
};

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
                    <MedicamentGroupResult key={index} item={result} />
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
