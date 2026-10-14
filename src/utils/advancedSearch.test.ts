import { describe, expect, it } from "vitest";
import {
  advancedSearchParams,
  initialAdvancedCriteria,
  parseAdvancedSearch,
  hasAdvancedSearchRequest,
} from "./advancedSearch";

describe("advanced search URL criteria", () => {
  it("opens advanced mode without searching, including legacy main-search terms", () => {
    for (const query of [
      "advanced=1",
      "advanced=1&s=paracetamol",
      "advanced=1&specialtyMatch=startsWith",
    ]) {
      const params = new URLSearchParams(query);
      expect(
        hasAdvancedSearchRequest(params, parseAdvancedSearch(params)!),
      ).toBe(false);
    }
  });
  it("searches submitted forms and directly shared criteria URLs", () => {
    for (const query of [
      "advanced=1&submitted=1",
      "advanced=1&specialty=doliprane",
      "advanced=1&marketingStatus=Arrêtée",
    ]) {
      const params = new URLSearchParams(query);
      expect(
        hasAdvancedSearchRequest(params, parseAdvancedSearch(params)!),
      ).toBe(true);
    }
  });
  it("keeps ordinary searches ordinary and allows an unrestricted advanced search", () => {
    expect(
      parseAdvancedSearch(new URLSearchParams("s=paracetamol")),
    ).toBeUndefined();
    expect(parseAdvancedSearch(new URLSearchParams("advanced=1"))).toEqual(
      initialAdvancedCriteria,
    );
    expect(
      parseAdvancedSearch(new URLSearchParams("advanced=1")),
    ).toMatchObject({
      specialtyMatch: "startsWith",
      substanceMatch: "startsWith",
      holderMatch: "startsWith",
    });
  });
  it("round trips cumulative criteria, accented names and matching modes", () => {
    const criteria = {
      ...initialAdvancedCriteria,
      substance: "Paracétamol",
      holder: "A & B",
      specialtyMatch: "contains" as const,
      authorizationTo: "2024-12-31",
    };
    const params = advancedSearchParams("acide & folique", criteria);
    expect(params.get("s")).toBe("acide & folique");
    expect(params.get("specialtyMatch")).toBe("contains");
    expect(parseAdvancedSearch(params)).toEqual(criteria);
  });
  it.each([
    "advanced=0",
    "authorizationStatus=unknown",
    "marketingStatus=unknown",
    "documentType=pdf",
    "specialtyMatch=fuzzy",
    "documentFrom=2024-02-30",
    "authorizationTo=12/01/2024",
    "documentFrom=2025-01-01&documentTo=2020-01-01",
    "holder=a&holder=b",
  ])("rejects invalid criteria: %s", (query) => {
    expect(() => parseAdvancedSearch(new URLSearchParams(query))).toThrow();
  });
  it("rejects excessively long input and accepts leap days", () => {
    expect(() =>
      parseAdvancedSearch(new URLSearchParams({ holder: "x".repeat(201) })),
    ).toThrow();
    expect(
      parseAdvancedSearch(new URLSearchParams("documentFrom=2024-02-29"))
        ?.documentFrom,
    ).toBe("2024-02-29");
  });
});
