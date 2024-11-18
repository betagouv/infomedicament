"use client";

import { createContext, useState } from "react";
import { Definition } from "@/data/grist/glossary";

// This context provider is used to store which glossary modals should be mounted
// depending on which words are used in the text.
// It is used to avoid mounting all modals at once
export const GlossaryContext = createContext<{
  definitions: Definition[];
  addDefinition: (arg0: Definition) => void;
}>({
  definitions: [],
  addDefinition: (definition: Definition) => {},
});

export default function GlossaryContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [definitions, setGlossary] = useState<Definition[]>([]);

  return (
    <GlossaryContext.Provider
      value={{
        definitions,
        addDefinition: (definition) => {
          if (
            !definitions.find(
              (def) =>
                def.fields.Nom_glossaire === definition.fields.Nom_glossaire,
            )
          ) {
            setGlossary([...definitions, definition]);
          }
        },
      }}
    >
      {children}
    </GlossaryContext.Provider>
  );
}
