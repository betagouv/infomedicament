import { fr } from "@codegouvfr/react-dsfr";
import { Fragment } from "react";
import Link from "next/link";

export default async function AlphabeticNav({
  letters,
  url,
}: {
  letters: string[];
  url: (letter: string) => string;
}) {
  return (
    <p className={fr.cx("fr-text--lg")}>
      {letters.map((a) => (
        <Fragment key={a}>
          <Link
            href={url(a)}
            className={fr.cx("fr-link", "fr-link--lg", "fr-mr-3w", "fr-mb-3w")}
          >
            {a}
          </Link>{" "}
        </Fragment>
      ))}
    </p>
  );
}
