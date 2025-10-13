import { fr } from "@codegouvfr/react-dsfr";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { getNormalizeLetter } from "@/utils/alphabeticNav";

function AlphabeticNav({
  letters,
  url,
  currentLetter,
}: {
  letters: string[];
  url: (letter: string) => string;
  currentLetter: string;
}) {

  const [currentLetters, setCurrentLetters] = useState<string[]>([]);

  useEffect(() => {
    setCurrentLetters(letters);
  }, [letters, setCurrentLetters])

  return (
    <p className={fr.cx("fr-text--lg")}>
      {currentLetters
        .map((a) => a && getNormalizeLetter(a))
        .map((a) => (a && a !== "\t") && (
          <Fragment key={a}>
            <Link
              href={url(a)}
              className={fr.cx(
                "fr-link",
                "fr-link--lg",
                "fr-mr-3w",
                "fr-mb-3w",
              )}
              style={{background: currentLetter === a ? "none" : ""}}
            >
              {a}
            </Link>{" "}
          </Fragment>
        ))}
    </p>
  );
};

export default AlphabeticNav;
