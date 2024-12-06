"use client";

import { useContext, useEffect, useState } from "react";
import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";
import { Definition } from "@/data/grist/glossary";
import slugify from "slugify";

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
      key={definition.fields.Nom_glossaire}
      href={`#Definition-${slugify(definition.fields.Nom_glossaire)}`}
      aria-describedby={`Definition-${slugify(definition.fields.Nom_glossaire)}`}
      role="button"
      {...(modal ? { onClick: modal.open } : {})}
    >
      {word}
    </a>
  );
}
