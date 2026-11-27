import { expect, it } from "vitest";
import {
  interactionSelectionKey,
  parseInteractionSelection,
} from "./interactionSelection";

it("round-trips a selection with accents, colons and URL characters after an index rebuild", () => {
  const entry = {
    id: 42,
    type: "medicament" as const,
    label: "Médicament : A+B & C",
    subst_ids: ["1"],
    class_ids: [],
  };
  const params = new URLSearchParams({
    medicament1: interactionSelectionKey(entry),
  });
  expect(
    parseInteractionSelection(
      new URLSearchParams(params.toString()).get("medicament1")!,
    ),
  ).toEqual({ type: entry.type, label: entry.label });
  expect(interactionSelectionKey({ ...entry, id: 99 })).toBe(
    interactionSelectionKey(entry),
  );
});

it.each([
  undefined,
  "",
  "12",
  "invalid:Name",
  "medicament:",
  ["medicament:A", "medicament:B"],
])("rejects malformed or repeated selections: %s", (value) => {
  expect(parseInteractionSelection(value)).toBeNull();
});
