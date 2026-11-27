import type { InteractionsSearchEntry } from "@/db/types";

export const INTERACTIONS_TITLE = "Interactions médicamenteuses";

// Search-index numeric IDs are regenerated on import; type and label survive it.
export function interactionSelectionKey(
  entry: InteractionsSearchEntry,
): string {
  return `${entry.type}:${entry.label}`;
}

export function parseInteractionSelection(
  value: string | string[] | undefined,
) {
  if (typeof value !== "string") return null;
  const separator = value.indexOf(":");
  const type = value.slice(0, separator);
  const label = value.slice(separator + 1);
  if (
    separator < 0 ||
    !label ||
    !["medicament", "substance", "class"].includes(type)
  ) {
    return null;
  }
  return { type: type as InteractionsSearchEntry["type"], label };
}

export function interactionsTitle(
  slot1: InteractionsSearchEntry | null,
  slot2: InteractionsSearchEntry | null,
): string {
  const names = [slot1?.label, slot2?.label].filter(Boolean);
  return names.length
    ? `${INTERACTIONS_TITLE} : ${names.join(" et ")}`
    : INTERACTIONS_TITLE;
}
