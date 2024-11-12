import { getGristTableData } from "@/data/grist";
import slugify from "slugify";
import sanitizeHtml from "sanitize-html";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { memo } from "react";

// Preloads all Definitions modals in the body
const GlossaryModals = memo(async function GlossaryModals() {
  const definitions = (await getGristTableData("Glossaire", [
    "Nom_glossaire",
    "Definition_glossaire",
    "Source",
  ])) as {
    id: number;
    fields: {
      Nom_glossaire: string;
      Definition_glossaire: string;
      Source: string;
    };
  }[];

  return (
    <>
      {definitions.map((definition) => {
        const definitionModal = createModal({
          isOpenedByDefault: false,
          id: `Definition-${slugify(definition.fields.Nom_glossaire)}`,
        });
        return (
          <definitionModal.Component
            title={definition.fields.Nom_glossaire}
            key={slugify(definition.fields.Nom_glossaire)}
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
      })}
    </>
  );
});

export default GlossaryModals;
