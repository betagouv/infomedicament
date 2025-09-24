import { fr } from "@codegouvfr/react-dsfr";
import { Fragment } from "react";
import Link from "next/link";

function AlphabeticNav({
  letters,
  url,
  currentLetter,
}: {
  letters: string[];
  url: (letter: string) => string;
  currentLetter: string;
}) {
  return (
    <p className={fr.cx("fr-text--lg")}>
      {letters
        .map((a) => a && a.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        .map((a) => a && (
          <Fragment key={a}>
            <Link
              href={url(a.toUpperCase())}
              className={fr.cx(
                "fr-link",
                "fr-link--lg",
                "fr-mr-3w",
                "fr-mb-3w",
              )}
              style={{background: currentLetter === a ? "none" : ""}}
            >
              {a.toUpperCase()}
            </Link>{" "}
          </Fragment>
        ))}
    </p>
  );
};

export default AlphabeticNav;
