"use client";

import sanitizeHtml from "sanitize-html";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import React, { useContext } from "react";
import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";
import { usePathname } from "next/navigation";
import { Definition } from "@/types/GlossaireTypes";

export default function DefinitionModal({
  definition,
}: {
  definition: Definition;
}): React.JSX.Element | null {
  const pathname = usePathname();
  const { getDefinitionModalAndUpdateGlossary } = useContext(GlossaryContext);
  const modal = getDefinitionModalAndUpdateGlossary(definition);

  useIsModalOpen(modal, {
    onConceal: () =>
      typeof window !== "undefined" &&
      window.location?.hash &&
      window.history?.pushState(null, "", pathname),
  });

  return (
    <modal.Component title={definition.fields.Nom_glossaire} topAnchor={false}>
      <div
        dangerouslySetInnerHTML={{
          __html: sanitizeHtml(definition.fields.Definition_glossaire, {
            allowedTags: ["p", "br", "ul", "ol", "li"],
          }),
        }}
      />
    </modal.Component>
  );
}
