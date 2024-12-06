"use client";

import slugify from "slugify";
import { useContext } from "react";
import DefinitionModal from "@/components/glossary/GlossaryModals/DefinitionModal";
import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";

export default function GlossaryModals() {
  const { definitions } = useContext(GlossaryContext);

  return (
    <>
      {definitions.map((definition) => (
        <DefinitionModal
          definition={definition}
          key={`key-${slugify(definition.fields.Nom_glossaire)}`}
        />
      ))}
    </>
  );
}
