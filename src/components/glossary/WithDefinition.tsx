"use client";

import { useContext, useEffect, useState } from "react";
import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";
import slugify from "slugify";
import { Definition } from "@/types/GlossaireTypes";

// Client component to add a definition to the glossary context
// and a link to the definition modal
export default function WithDefinition({
  definition,
  word,
}: {
  definition: Definition;
  word: string;
}) {
  const { getDefinitionModalAndUpdateGlossary } = useContext(GlossaryContext);
  const [modal, setModal] =
    useState<ReturnType<typeof getDefinitionModalAndUpdateGlossary>>();

  useEffect(() => {
    setModal(getDefinitionModalAndUpdateGlossary(definition));
  }, [definition, getDefinitionModalAndUpdateGlossary]);

  return (
    <a
      key={definition.nom}
      href={`#Definition-${slugify(definition.nom)}`}
      aria-describedby={`Definition-${slugify(definition.nom)}`}
      role="button"
      {...(modal ? { onClick: modal.open } : {})}
    >
      {word}
    </a>
  );
}
