"use client";

import { useContext, useEffect } from "react";
import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";
import { Definition } from "@/data/grist/glossary";

// Client component to add a definition to the glossary context
export default function AddDefinition({
  definition,
}: {
  definition: Definition;
}): null {
  const { addDefinition } = useContext(GlossaryContext);

  useEffect(() => addDefinition(definition));

  return null;
}
