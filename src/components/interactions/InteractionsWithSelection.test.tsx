import { beforeEach, expect, it, vi } from "vitest";
import InteractionsWithSelection, {
  interactionsMetadata,
} from "./InteractionsWithSelection";
import {
  getInteractionSelection,
  lookupInteractions,
} from "@/db/utils/interactions";
import type { InteractionsSearchEntry } from "@/db/types";

vi.mock("@/db/utils/interactions", () => ({
  getInteractionSelection: vi.fn(),
  lookupInteractions: vi.fn(),
}));
vi.mock("./InteractionsBlock", () => ({ default: () => null }));

const first: InteractionsSearchEntry = {
  id: 1,
  type: "medicament",
  label: "Médicament A",
  subst_ids: ["a"],
  class_ids: [],
};
const second: InteractionsSearchEntry = {
  id: 2,
  type: "class",
  label: "Classe B",
  subst_ids: [],
  class_ids: ["b"],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getInteractionSelection).mockImplementation(async (value) =>
    value === "medicament:Médicament A"
      ? first
      : value === "class:Classe B"
        ? second
        : null,
  );
  vi.mocked(lookupInteractions).mockResolvedValue([]);
});

it("restores a shared checked pair and computes results using database identifiers", async () => {
  const props = {
    searchParams: Promise.resolve({
      medicament1: "medicament:Médicament A",
      medicament2: "class:Classe B",
      verifier: "1",
    }),
  };
  const page = await InteractionsWithSelection(props);
  expect(page.props).toEqual({ slot1: first, slot2: second, results: [] });
  expect(lookupInteractions).toHaveBeenCalledWith(["a"], [], [], ["b"]);
  expect(await interactionsMetadata(props)).toEqual({
    title: "Interactions médicamenteuses : Médicament A et Classe B",
  });
});

it("restores an unverified selection without running the lookup", async () => {
  const page = await InteractionsWithSelection({
    searchParams: Promise.resolve({
      medicament1: "medicament:Médicament A",
      medicament2: "class:Classe B",
    }),
  });
  expect(page.props).toEqual({ slot1: first, slot2: second, results: null });
  expect(lookupInteractions).not.toHaveBeenCalled();
});

it("ignores unknown entries and does not display them in metadata or run a partial lookup", async () => {
  const props = {
    searchParams: Promise.resolve({
      medicament1: "unknown",
      medicament2: "class:Classe B",
      verifier: "1",
    }),
  };
  const page = await InteractionsWithSelection(props);
  expect(page.props).toEqual({ slot1: null, slot2: second, results: null });
  expect(lookupInteractions).not.toHaveBeenCalled();
  expect(await interactionsMetadata(props)).toEqual({
    title: "Interactions médicamenteuses : Classe B",
  });
});

it("uses the default title for an empty URL", async () => {
  expect(
    await interactionsMetadata({ searchParams: Promise.resolve({}) }),
  ).toEqual({ title: "Interactions médicamenteuses" });
});
