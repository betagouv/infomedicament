import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { formatSpecName } from "@/displayUtils";
import { HTMLAttributes } from "react";

interface SubstanceResultProps extends HTMLAttributes<HTMLDivElement> {
  item: SubstanceNom;
}

function SubstanceResult({
  item,
}: SubstanceResultProps) {

  return (
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
};

export default SubstanceResult;
