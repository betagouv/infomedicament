import { getGristTableData } from "@/data/grist/index";

export interface Definition {
  fields: {
    Nom_glossaire: string;
    Definition_glossaire: string;
    Source: string;
    A_publier: boolean;
  };
}

export default async function getGlossaryDefinitions(): Promise<Definition[]> {
  const definitions = (await getGristTableData("Glossaire", [
    "Nom_glossaire",
    "Definition_glossaire",
    "Source",
    "A_publier",
  ])) as Definition[];

  // Deduplicates the definitions
  const definitionsMap = new Map<string, (typeof definitions)[number]>();
  definitions.forEach((definition) => {
    definitionsMap.set(definition.fields.Nom_glossaire, definition);
  });
  return Array.from(definitionsMap.values());
}
