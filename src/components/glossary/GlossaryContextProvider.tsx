"use client";

import React, { createContext, useState } from "react";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { Definition } from "@/types/GlossaireTypes";

// This context provider is used to store which glossary modals should be mounted
// depending on which words are used in the text.
// It is used to avoid mounting all modals at once
export const GlossaryContext = createContext<{
  definitions: Definition[];
  getDefinitionModalAndUpdateGlossary: (
    arg0: Definition,
  ) => ReturnType<typeof createModal>;
}>({
  definitions: [],
  getDefinitionModalAndUpdateGlossary: (definition: Definition) =>
    createModal({
      isOpenedByDefault: false,
      id: `Definition-${definition.fields.Nom_glossaire}`,
    }),
});

export default function GlossaryContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [definitions, setGlossary] = useState<Definition[]>([]);
  const [modals, setModals] = useState<
    Record<string, ReturnType<typeof createModal>>
  >({});

  // We create modals in the context provider to avoid creating them multiple times
  // in WithDefinition on one side and in DefinitionModal on the other side
  // Creating the same modal twice from different places would lead to a bug
  const getDefinitionModalAndUpdateGlossary = (
    definition: Definition,
  ): ReturnType<typeof createModal> => {
    if (
      !definitions.find(
        (def) => def.fields.Nom_glossaire === definition.fields.Nom_glossaire,
      )
    ) {
      setGlossary([...definitions, definition]);
    }

    if (!modals[definition.fields.Nom_glossaire]) {
      setModals({
        ...modals,
        [definition.fields.Nom_glossaire]: createModal({
          isOpenedByDefault: false,
          id: `Definition-${definition.fields.Nom_glossaire}`,
        }),
      });
    }

    return modals[definition.fields.Nom_glossaire];
  };

  return (
    <GlossaryContext.Provider
      value={{
        definitions,
        getDefinitionModalAndUpdateGlossary,
      }}
    >
      {children}
    </GlossaryContext.Provider>
  );
}
