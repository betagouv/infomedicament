import slugify from "slugify";
import { memo } from "react";
import DefinitionModal from "@/components/glossary/GlossaryModals/DefinitionModal";
import getGlossaryDefinitions from "@/data/grist/glossary";

// Preloads all Definitions server side
// DefinitionModal then displays lazily depending on
// weither the definition is in GlossaryContext
const GlossaryModals = memo(async function GlossaryModals() {
  const definitions = await getGlossaryDefinitions();

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
});

export default GlossaryModals;
