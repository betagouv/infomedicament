"use client";

import { useContext } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { GlossaryContext } from "./GlossaryContextProvider";
import type { Definition } from "@/types/GlossaireTypes";

export default function WithDefinition({
  definition,
  word,
}: {
  definition?: Definition;
  word: string;
}) {
  const { openDefinition } = useContext(GlossaryContext);

  return definition ? (
    <button
      type="button"
      className={fr.cx("fr-link")}
      aria-haspopup="dialog"
      onClick={(event) => openDefinition(definition, event.currentTarget)}
    >
      {word}
    </button>
  ) : (
    <span>{word}</span>
  );
}
