import { describe, expect, it } from "vitest";
import {
  advancedSearchParams,
  initialAdvancedCriteria,
  parseAdvancedSearch,
  hasAdvancedSearchCriteria,
} from "./advancedSearch";

describe("advanced search URL criteria", () => {
  it("opens advanced mode without searching, including legacy main-search terms", () => {
    for (const query of [
      "advanced=1",
      "advanced=1&submitted=1",
      "advanced=1&submitted=1&page=11&order=desc",
      "advanced=1&specialty=%20%20",
      "advanced=1&s=paracetamol",
      "advanced=1&specialtyMatch=startsWith",
    ]) {
      const params = new URLSearchParams(query);
      expect(hasAdvancedSearchCriteria(parseAdvancedSearch(params)!)).toBe(
        false,
      );
    }
  });
  it("searches submitted forms and directly shared criteria URLs", () => {
    for (const query of [
      "advanced=1&specialty=doliprane",
      "advanced=1&marketingStatus=Arrêtée",
    ]) {
      const params = new URLSearchParams(query);
      expect(hasAdvancedSearchCriteria(parseAdvancedSearch(params)!)).toBe(
        true,
      );
    }
  });
  it("keeps ordinary searches ordinary and restores an empty advanced form", () => {
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

describe("advanced result navigation", () => {
  it("restores all filters, order and page from a shareable URL", async () => {
    const { advancedResultParams, parseAdvancedResultOptions } = await import(
      "./advancedSearch"
    );
    const options = {
      page: 12,
      substances: ["Paracétamol", "Caféine"],
      atcs: ["N02"],
      indications: ["1"],
      descending: true,
    };
    const params = advancedResultParams(
      { ...initialAdvancedCriteria, procedure: "NATIONALE" },
      options,
    );
    expect(params.has("submitted")).toBe(false);
    expect(parseAdvancedResultOptions(params)).toEqual(options);
    expect(parseAdvancedSearch(params)?.procedure).toBe("NATIONALE");
  });
  it.each([
    "page=0",
    "page=-1",
    "page=1.5",
    "page=1&page=2",
    "filterAtc=bad",
    "filterIndication=oops",
    "order=bad",
    "procedure=bad",
  ])("rejects invalid navigation or procedure: %s", async (query) => {
    const { parseAdvancedResultOptions } = await import("./advancedSearch");
    expect(() => {
      const params = new URLSearchParams(`advanced=1&${query}`);
      parseAdvancedSearch(params);
      parseAdvancedResultOptions(params);
    }).toThrow();
  });
});
