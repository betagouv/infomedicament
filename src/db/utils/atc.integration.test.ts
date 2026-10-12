import { describe, expect, it, vi } from "vitest";
import {
  getAtc1,
  getAtc1DefinitionData,
  getAtc2,
  getAtcMenuItems,
  getResumeSubstancesByAtc,
  getSubstancesByAtc,
} from "./atc";
import { getSubstancesResume } from "./substances";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

describe("PostgreSQL ATC projections", () => {
  it("uses the destination substance list for the parent A02 card", async () => {
    const parent = await getAtc1DefinitionData(await getAtc1("A"));
    const acidity = parent.find((entry) => entry.atc.code === "A02");
    const candidates = await getSubstancesByAtc(await getAtc2("A02"));
    const destination = await getSubstancesResume(candidates.map((s) => s.NomId));

    expect(destination.length).toBeGreaterThan(0);
    expect(acidity?.substances.map((s) => s.NomId)).toEqual(
      destination.map((s) => s.NomId),
    );
  });
  it("returns stable public substance identities", async () => {
    const substances = await getSubstancesByAtc(await getAtc2("A03"));
    expect(substances.some((substance) => substance.NomId === "40521")).toBe(true);
    expect(substances.some((substance) => substance.NomId === "92651")).toBe(true);
  });

  it("projects summary-backed substances for the parent", async () => {
    const data = await getAtc1DefinitionData(await getAtc1("A"));
    const antispasmodics = data.find((entry) => entry.atc.code === "A03");
    expect(antispasmodics?.substances.length).toBeGreaterThan(0);
    expect(antispasmodics?.substances.some(
      (substance) => substance.NomId === "40521",
    )).toBe(true);
  });
});

describe("Test data on ATC 1 & 2 pages", () => {
    it("getAtc1DefinitionData", async () => {
    const data = await getAtc1DefinitionData(await getAtc1("A"));
    const atcSubs = data.find((entry) => entry.atc.code === "A03");
    expect(atcSubs?.substances.length).toBeGreaterThan(0);
  });

  it("returns the same number of substances on ATC 1 & 2 pages", async () => {
    const atc1Codes = await getAtcMenuItems();
    expect(atc1Codes.length).toBeGreaterThan(0);

    for (const { code } of atc1Codes) {
      const data = await getAtc1DefinitionData(await getAtc1(code));
      for (const { atc, substances } of data) {
        const atc2Substances = await getResumeSubstancesByAtc(await getAtc2(atc.code));
        expect(atc2Substances.length, `ATC ${atc.code}`).toBe(substances.length);
      }
    }
  }, 300000);
});
