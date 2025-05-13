import { Fragment, HTMLAttributes } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import { SearchATCClass } from "@/types/SearchType";
import { formatSpecName } from "@/displayUtils";

interface ATCClassResultProps extends HTMLAttributes<HTMLDivElement> {
  item: SearchATCClass;
}

function ATCClassResult({
  item,
}: ATCClassResultProps) {
  return (
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
};

export default ATCClassResult;
