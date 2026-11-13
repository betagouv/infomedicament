import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import {
  getCachedAdvancedSearchResults,
  getCachedAdvancedSearchPage,
} from "@/db/utils/advancedSearch";
import { initialAdvancedCriteria } from "@/utils/advancedSearch";

vi.mock("@/db/utils/advancedSearch", () => ({
  getCachedAdvancedSearchResults: vi.fn(),
  getCachedAdvancedSearchPage: vi.fn(),
}));

describe("advanced search results API", () => {
  beforeEach(() => {
    vi.mocked(getCachedAdvancedSearchResults).mockReset();
    vi.mocked(getCachedAdvancedSearchResults).mockResolvedValue([]);
  });
  const request = (query: string) =>
    GET(
      new NextRequest(`http://localhost/rechercher/advanced/results?${query}`),
    );
  it("accepts criteria-only searches without a mode flag", async () => {
    expect((await request("holder=Exemple")).status).toBe(200);
    expect(getCachedAdvancedSearchResults).toHaveBeenCalledWith("", {
      ...initialAdvancedCriteria,
      holder: "Exemple",
    });
  });
  it("combines the main query with advanced criteria", async () => {
    await request("s=paracetamol&documentType=rcp");
    expect(getCachedAdvancedSearchResults).toHaveBeenCalledWith("paracetamol", {
      ...initialAdvancedCriteria,
      documentType: "rcp",
    });
  });
  it.each([
    "",
    "advanced=1&submitted=1&page=11&order=desc",
    "specialty=%20%20",
    "filterAtc=N05",
  ])(
    "returns no results and never queries for empty criteria: %s",
    async (query) => {
      vi.mocked(getCachedAdvancedSearchPage).mockClear();
      const response = await request(query);
      expect(response.status).toBe(200);
      expect(response.headers.get("X-Search-Total-Count")).toBe("0");
      expect(await response.json()).toEqual([]);
      expect(getCachedAdvancedSearchResults).not.toHaveBeenCalled();
      expect(getCachedAdvancedSearchPage).not.toHaveBeenCalled();
    },
  );
  it.each([
    "documentFrom=2024-02-30",
    "advanced=0",
    "documentType=pdf",
    "holder=a&holder=b",
  ])("rejects invalid criteria without querying: %s", async (query) => {
    expect((await request(query)).status).toBe(400);
    expect(getCachedAdvancedSearchResults).not.toHaveBeenCalled();
  });
  it("rejects an excessively long main query", async () => {
    expect((await request(`s=${"x".repeat(201)}`)).status).toBe(400);
    expect(getCachedAdvancedSearchResults).not.toHaveBeenCalled();
  });
});

it("exposes exact totals and 50-row pages for explicit pagination", async () => {
  vi.mocked(getCachedAdvancedSearchPage).mockResolvedValue({
    total: 505,
    page: 11,
    results: [],
    facets: { substances: [], atcs: [], indications: [] },
  });
  const response = await GET(
    new NextRequest(
      "http://localhost/rechercher/advanced/results?procedure=NATIONALE&page=11",
    ),
  );
  expect(response.headers.get("X-Search-Total-Count")).toBe("505");
  expect(response.headers.get("X-Search-Page")).toBe("11");
  expect(response.headers.get("X-Search-Result-Limit")).toBe("50");
});
