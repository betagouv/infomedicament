import { Definition } from "@/types/GlossaireTypes";

export function getDefinition(definitions: Definition[], definitionName: string): Definition | undefined {
  return definitions.find((definition) => definition.nom === definitionName);
}