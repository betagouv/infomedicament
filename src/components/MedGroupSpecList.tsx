import { getAtcLabels } from "@/data/grist/atc";
import { fr } from "@codegouvfr/react-dsfr";
import {
  displaySimpleComposants,
  formatSpecName,
  MedicamentGroup,
} from "@/displayUtils";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Link from "next/link";
import { parse as csvParse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import React from "react";
import { getSpecialite } from "@/db/pdbmMySQL/utils";

const atcData = csvParse(
  readFileSync(
    path.join(process.cwd(), "src", "data", "CIS-ATC_2024-04-07.csv"),
  ),
) as string[][];
function getAtc(CIS: string) {
  const atc = atcData.find((row) => row[0] === CIS);
  return atc ? atc[1] : null;
}

export default async function MedGroupSpecList({
  medGroup,
  className,
}: {
  medGroup: MedicamentGroup;
  className?: string;
}) {
  const [groupName, specialites] = medGroup;
  const atc = getAtc(specialites[0].SpecId);
  const { composants } = await getSpecialite(specialites[0].SpecId);
  const atcLabels = atc ? await getAtcLabels(atc) : null;
  const [, subClass] = atcLabels ? atcLabels : [null, null];
  return (
    <li className={className}>
      <div>
        <div className={fr.cx("fr-mb-1v")}>
          <span className={fr.cx("fr-text--md", "fr-text--bold")}>
            {formatSpecName(groupName)}
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
                  className: cx("fr-tag--custom-alt-class"),
                }}
              >
                {subClass}
              </Tag>
            )}
            {displaySimpleComposants(composants).map(
              (substance: SubstanceNom) => (
                <Tag
                  key={substance.NomId}
                  small
                  linkProps={{
                    href: `/substances/${substance.NomId}`,
                    className: cx("fr-tag--custom-alt-substance"),
                  }}
                >
                  {substance.NomLib}
                </Tag>
              ),
            )}
          </ul>
        </div>
      </div>
      <ul className={fr.cx("fr-raw-list", "fr-pl-3w")}>
        {specialites?.map((specialite, i) => (
          <li key={i} className={fr.cx("fr-mb-1v")}>
            <Link
              href={`/medicaments/${specialite.SpecId}`}
              className={fr.cx("fr-text--sm", "fr-link")}
            >
              {formatSpecName(specialite.SpecDenom01)}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export async function MedGroupSpecListList({
  items,
}: {
  items: MedicamentGroup[];
}) {
  return (
    <ul className={fr.cx("fr-raw-list")}>
      {items.map((item) => (
        <MedGroupSpecList
          key={item[0]}
          medGroup={item}
          className={fr.cx("fr-mb-3w")}
        />
      ))}
    </ul>
  );
}
