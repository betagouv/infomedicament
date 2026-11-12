"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { useEffect } from "react";
import type { Definition } from "@/types/GlossaireTypes";

const modal = createModal({
  id: "GlossaryDefinition",
  isOpenedByDefault: false,
});

export default function DefinitionModal({
  selection,
  onClose,
}: {
  selection?: { definition: Definition };
  onClose: () => void;
}) {
  useIsModalOpen(modal, { onConceal: onClose });

  // DSFR must see the committed title and content before opening and focusing.
  useEffect(() => {
    if (selection) modal.open();
  }, [selection]);

  return (
    <modal.Component title={selection?.definition.nom ?? "Définition"} topAnchor={false}>
      <div dangerouslySetInnerHTML={{ __html: selection?.definition.definition ?? "" }} />
    </modal.Component>
  );
}
