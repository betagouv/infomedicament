import { describe, expect, it, vi } from "vitest";
import {
  getAtc1,
  getAtc1DefinitionData,
  getAtc2,
  getAtcMenuItems,
  getResumeSubstancesByAtc,
  getSubstancesByAtc,
} from "./atc";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

describe("Test data on ATC 1 & 2 pages", () => {
  it("getSubstancesByAtc", async () => {
    const substances = await getSubstancesByAtc(await getAtc2("A03"));
    expect(substances.some((substance) => substance.NomId === "40521")).toBe(true);
    expect(substances.some((substance) => substance.NomId === "92651")).toBe(true);
  });

  it("getAtc1DefinitionData", async () => {
    const data = await getAtc1DefinitionData(await getAtc1("A"));
    const atcSubs = data.find((entry) => entry.atc.code === "A03");
    expect(atcSubs?.nbSubstances).toBeGreaterThan(0);
  });

  it("returns the same number of substances on ATC 1 & 2 pages", async () => {
    const atc1Codes = await getAtcMenuItems();
    expect(atc1Codes.length).toBeGreaterThan(0);

    for (const { code } of atc1Codes) {
      const data = await getAtc1DefinitionData(await getAtc1(code));
      for (const { atc, nbSubstances } of data) {
        const atc2Substances = await getResumeSubstancesByAtc(await getAtc2(atc.code));
        expect(atc2Substances.length, `ATC ${atc.code}`).toBe(nbSubstances);
      }
    }
  }, 300000);
});
