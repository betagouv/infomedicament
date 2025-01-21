import { getAtc2, getAtcCode } from "@/data/grist/atc";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName, MedicamentGroup } from "@/displayUtils";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import Link from "next/link";
import React from "react";
import { getSpecialite } from "@/db/utils";
import ClassTag from "@/components/tags/ClassTag";
import SubstanceTag from "@/components/tags/SubstanceTag";

export default async function MedGroupSpecList({
  medGroup,
  className,
}: {
  medGroup: MedicamentGroup;
  className?: string;
}) {
  const [groupName, specialites] = medGroup;
  const atc = getAtcCode(specialites[0].SpecId);
  const { composants } = await getSpecialite(specialites[0].SpecId);
  const atc2 = await getAtc2(atc);
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
            <ClassTag atc2={atc2} />
            <SubstanceTag composants={composants} />
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
