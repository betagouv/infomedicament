import { describe, expect, it } from "vitest";
import { getGroupSubstancesNames } from "./seeds/1725439927263_searchIndex";

// Abacavir (31844): synonym "abacavir" (65799) and canonical "abacavir base" (31844)
const namesByNomId = new Map([
  ["65799", "abacavir"],
  ["31844", "abacavir base"],
  ["02202", "paracétamol"],
]);

describe("search index - getGroupSubstancesNames", () => {
  it("returns only the substances names displayed on the medicaments of the group", () => {
    expect(getGroupSubstancesNames(["65799"], namesByNomId)).toEqual(["abacavir"]);
    expect(getGroupSubstancesNames(["31844 "], namesByNomId)).toEqual(["abacavir base"]);
  });

  it("returns the names of each substance of the group, once", () => {
    expect(getGroupSubstancesNames(["31844", "02202", "02202"], namesByNomId)).toEqual(["abacavir base", "paracétamol"]);
  });

  it("ignores the names not in the substances list", () => {
    expect(getGroupSubstancesNames(["99999"], namesByNomId)).toEqual([]);
  });
});
