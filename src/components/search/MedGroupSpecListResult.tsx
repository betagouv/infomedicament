import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import Link from "next/link";
import React, { HTMLAttributes } from "react";
import ClassTag from "@/components/tags/ClassTag";
import SubstanceTag from "@/components/tags/SubstanceTag";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";

interface MedGroupSpecListResultProps extends HTMLAttributes<HTMLDivElement> {
  item: AdvancedMedicamentGroup;
}

function MedGroupSpecListResult({
  item
}: MedGroupSpecListResultProps) {

  const specialites = item.specialites;
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
            <ClassTag atc2={item.atc2} />
            <SubstanceTag composants={item.composants} />
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
};

export default MedGroupSpecListResult;
