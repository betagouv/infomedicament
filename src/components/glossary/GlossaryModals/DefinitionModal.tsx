"use client";

import { Definition } from "@/data/grist/glossary";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import slugify from "slugify";
import sanitizeHtml from "sanitize-html";
import { useContext } from "react";
import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";

// We use a client component to lazy load modal mounting
export default function DefinitionModal({
  definition,
}: {
  definition: Definition;
}): React.JSX.Element | null {
  const definitionModal = createModal({
    isOpenedByDefault: false,
    id: `Definition-${slugify(definition.fields.Nom_glossaire)}`,
  });

  const { definitions } = useContext(GlossaryContext);

  if (
    !definitions
      .map(({ fields: { Nom_glossaire } }) => Nom_glossaire)
      .includes(definition.fields.Nom_glossaire)
  ) {
    return null;
  }

  return (
    <definitionModal.Component
      title={definition.fields.Nom_glossaire}
      topAnchor={false}
    >
      <div
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(definition.fields.Definition_glossaire, {
            allowedTags: ["p", "br", "ul", "ol", "li"],
          }),
        }}
      />
    </definitionModal.Component>
  );
}
