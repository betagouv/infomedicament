import path from "node:path";
import { readFileSync } from "node:fs";
import { Fragment } from "react";
import { parse as csvParse } from "csv-parse/sync";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";

import { atcToBreadcrumbs, formatSpecName } from "@/displayUtils";
import { Specialite, SubstanceNom } from "@/db/pdbmMySQL/types";
import { getResults } from "@/db/search";
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
    <Link href={`/substance/${item.NomId}`}>
      <ListItemButton sx={{ py: "0.125rem" }}>
        <ListItemText
          disableTypography
          primary={
            <>
              <i
                className={cx(
                  "fr-icon--custom-molecule",
                  fr.cx("fr-icon--sm", "fr-mr-1w"),
                )}
              />
              <span className={fr.cx("fr-text--md", "fr-text--bold")}>
                {formatSpecName(item.NomLib)}
              </span>
            </>
          }
        />
        <i className={fr.cx("fr-icon-arrow-right-line", "fr-icon--sm")} />
      </ListItemButton>
    </Link>
  </li>
);

const MedicamentGroupResult = ({
  item,
}: {
  item: { groupName: string; specialites: Specialite[] };
}) => {
  const atc = getAtc(item.specialites[0].SpecId);
  const atcBreadcrumbs = atc ? atcToBreadcrumbs(atc) : null;
  const [, subClass, substance] = atcBreadcrumbs
    ? atcBreadcrumbs
    : [null, null, null];
  return (
    <li className={fr.cx("fr-mb-3w")}>
      <ListItem component="div" sx={{ py: "0.125rem" }}>
        <ListItemText
          sx={{ my: 0 }}
          disableTypography
          primary={
            <div className={fr.cx("fr-mb-1v")}>
              <span className={fr.cx("fr-text--md", "fr-text--bold")}>
                {formatSpecName(item.groupName)}
              </span>
            </div>
          }
          secondary={
            <div
              className={fr.cx("fr-grid-row")}
              style={{ flexWrap: "nowrap" }}
            >
              <div className={"fr-mr-1w"}>
                <i
                  className={cx("fr-icon--custom-pill", fr.cx("fr-icon--sm"))}
                />
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
          }
        />
      </ListItem>
      <List sx={{ my: 0, py: 0 }}>
        {item.specialites?.map((specialite, i) => (
          <li key={i} className={fr.cx("fr-py-0")}>
            <Divider sx={{ py: 0 }} />
            <Link href={`/medicament/${specialite.SpecId}`}>
              <ListItemButton sx={{ py: "0.125rem" }}>
                <ListItemText
                  disableTypography
                  primary={
                    <span className={fr.cx("fr-text--sm")}>
                      {formatSpecName(specialite.SpecDenom01)
                        .replace(`${formatSpecName(item.groupName)}, `, "")
                        .replace(formatSpecName(item.groupName), "")}
                    </span>
                  }
                />
                <i
                  className={fr.cx("fr-icon-arrow-right-line", "fr-icon--sm")}
                />
              </ListItemButton>
            </Link>
          </li>
        ))}
      </List>
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
            <List>
              {results.map((result, index) => (
                <Fragment key={index}>
                  {"NomLib" in result ? (
                    <SubstanceResult item={result} />
                  ) : (
                    <MedicamentGroupResult key={index} item={result} />
                  )}
                </Fragment>
              ))}
            </List>
          </div>
        </div>
      )}
    </>
  );
}
