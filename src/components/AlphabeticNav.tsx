"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { getNormalizeLetter } from "@/utils/alphabeticNav";

function AlphabeticNav({
  letters,
  urlPrefix,
  currentLetter,
}: {
  letters: string[];
  urlPrefix: string;
  currentLetter: string;
}) {

  const [currentLetters, setCurrentLetters] = useState<string[]>([]);

  useEffect(() => {
    setCurrentLetters(letters);
  }, [letters, setCurrentLetters])

  return (
    <p className={fr.cx("fr-text--lg")}>
      {currentLetters
        .map((letter) => letter && getNormalizeLetter(letter))
        .map((letter) => (letter && letter !== "\t") && (
          <Fragment key={letter}>
            <Link
              href={`${urlPrefix}${letter}`}
              className={fr.cx(
                "fr-link",
                "fr-link--lg",
                "fr-mr-3w",
                "fr-mb-3w",
              )}
              style={{background: currentLetter === letter ? "none" : ""}}
            >
              {letter}
            </Link>{" "}
          </Fragment>
        ))}
    </p>
  );
};

export default AlphabeticNav;
