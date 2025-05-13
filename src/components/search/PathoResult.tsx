import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { Patho } from "@/db/pdbmMySQL/types";
import { formatSpecName } from "@/displayUtils";
import { HTMLAttributes } from "react";

interface PathoResultProps extends HTMLAttributes<HTMLDivElement> {
  item: Patho;
}

function PathoResult({
  item,
}: PathoResultProps) {

  return (
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
};

export default PathoResult;
