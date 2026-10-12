import { beforeEach, expect, it, vi } from "vitest";
import Page from "./page";
import { getSearchResults, getSynonymSuggestion } from "@/db/utils";
import { getCachedAdvancedSearchResults } from "@/db/utils/advancedSearch";

vi.mock("@/db/utils", () => ({
  getSearchResults: vi.fn(),
  getSynonymSuggestion: vi.fn(),
}));
vi.mock("@/db/utils/advancedSearch", () => ({
  getCachedAdvancedSearchResults: vi.fn(),
}));
vi.mock("@/db/utils/articles", () => ({
  getArticlesFromSearchResults: vi.fn(),
}));
vi.mock("@/components/search/SearchPage", () => ({ default: () => null }));
vi.mock("@/components/rating/RatingToaster", () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());

it("preserves the advanced draft when a text criterion exceeds the limit", async () => {
  const holder = "x".repeat(201);
  const page = await Page({
    searchParams: Promise.resolve({
      advanced: "1",
      specialty: "Doliprane",
      specialtyMatch: "contains",
      holder,
      documentType: "rcp",
    }),
  });

  expect(page.props.advancedCriteria).toMatchObject({
    specialty: "Doliprane",
    specialtyMatch: "contains",
    holder,
    documentType: "rcp",
  });
  expect(page.props.searchError).toContain("200 caractères");
  expect(getCachedAdvancedSearchResults).not.toHaveBeenCalled();
  expect(getSearchResults).not.toHaveBeenCalled();
  expect(getSynonymSuggestion).not.toHaveBeenCalled();
});

it("keeps simple searches in simple mode when validation fails", async () => {
  const search = "x".repeat(201);
  const page = await Page({ searchParams: Promise.resolve({ s: search }) });

  expect(page.props.advancedCriteria).toBeUndefined();
  expect(page.props.search).toBe(search);
  expect(page.props.searchError).toContain("200 caractères");
  expect(getSearchResults).not.toHaveBeenCalled();
});
