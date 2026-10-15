import { beforeEach, expect, it, vi } from "vitest";
import Page from "./page";
import { getSearchResults, getSynonymSuggestion } from "@/db/utils";
import { getCachedAdvancedSearchResults } from "@/db/utils/advancedSearch";
import SearchPage from "@/components/search/SearchPage";
import { renderServerComponent } from "@/testsUtils/renderServerComponent";

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
vi.mock("@/components/search/SearchPage", () => ({
  default: vi.fn(() => null),
  SearchResultsContent: vi.fn(() => null),
}));
vi.mock("@/components/rating/RatingToaster", () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());

it("preserves the advanced draft when a text criterion exceeds the limit", async () => {
  const holder = "x".repeat(201);
  await renderServerComponent(
    Page({
      searchParams: Promise.resolve({
        advanced: "1",
        specialty: "Doliprane",
        specialtyMatch: "contains",
        holder,
        documentType: "rcp",
      }),
    }),
  );

  const props = vi.mocked(SearchPage).mock.calls[0][0];
  expect(props.advancedCriteria).toMatchObject({
    specialty: "Doliprane",
    specialtyMatch: "contains",
    holder,
    documentType: "rcp",
  });
  expect(props.searchError).toContain("200 caractères");
  expect(getCachedAdvancedSearchResults).not.toHaveBeenCalled();
  expect(getSearchResults).not.toHaveBeenCalled();
  expect(getSynonymSuggestion).not.toHaveBeenCalled();
});

it("keeps simple searches in simple mode when validation fails", async () => {
  const search = "x".repeat(201);
  await renderServerComponent(
    Page({ searchParams: Promise.resolve({ s: search }) }),
  );

  const props = vi.mocked(SearchPage).mock.calls[0][0];
  expect(props.advancedCriteria).toBeUndefined();
  expect(props.search).toBe(search);
  expect(props.searchError).toContain("200 caractères");
  expect(getSearchResults).not.toHaveBeenCalled();
});

it.each<Record<string, string>>([
  { s: "doliprane" },
  { advanced: "1", specialty: "Doliprane", submitted: "1" },
])("streams the search form before fetching results for %j", async (params) => {
  vi.mocked(getSearchResults).mockResolvedValue([]);
  vi.mocked(getSynonymSuggestion).mockResolvedValue([]);
  vi.mocked(getCachedAdvancedSearchResults).mockResolvedValue([]);
  const page = Page({ searchParams: Promise.resolve(params) });
  const query = page.props.children;
  const shell = await query.type(query.props);

  expect(shell.type).toBe(SearchPage);
  expect(getSearchResults).not.toHaveBeenCalled();
  expect(getCachedAdvancedSearchResults).not.toHaveBeenCalled();

  const boundary = shell.props.children;
  expect(boundary.props.fallback).toBeDefined();
  const results = boundary.props.children;
  await results.type(results.props);
  if (params.advanced) {
    expect(getCachedAdvancedSearchResults).toHaveBeenCalledWith(
      "",
      expect.objectContaining({ specialty: "Doliprane" }),
    );
    expect(getSearchResults).not.toHaveBeenCalled();
  } else {
    expect(getSearchResults).toHaveBeenCalledWith("doliprane");
    expect(getSynonymSuggestion).toHaveBeenCalledWith("doliprane");
  }
});
