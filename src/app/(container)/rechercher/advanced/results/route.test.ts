import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getCachedAdvancedSearchResults } from "@/db/utils/advancedSearch";
import { initialAdvancedCriteria } from "@/utils/advancedSearch";

vi.mock("@/db/utils/advancedSearch", () => ({
  getCachedAdvancedSearchResults: vi.fn(),
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
  it("uses unrestricted advanced criteria for an empty request", async () => {
    const response = await request("");
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Search-Result-Limit")).toBe("500");
    expect(getCachedAdvancedSearchResults).toHaveBeenCalledWith(
      "",
      initialAdvancedCriteria,
    );
    expect(await response.json()).toEqual([]);
  });
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
