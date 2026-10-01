import { describe, expect, it, vi } from "vitest";
import { getAtc1, getAtc1DefinitionData, getAtc2, getSubstancesByAtc } from "./atc";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

describe("PostgreSQL ATC projections", () => {
  it("returns stable public substance identities", async () => {
    const substances = await getSubstancesByAtc(await getAtc2("A03"));
    expect(substances.some((substance) => substance.NomId === "40521")).toBe(true);
    expect(substances.some((substance) => substance.NomId === "92651")).toBe(true);
  });

  it("projects substances and single-component specialities together", async () => {
    const data = await getAtc1DefinitionData(await getAtc1("A"));
    const antispasmodics = data.find((entry) => entry.atc.code === "A03");
    expect(antispasmodics?.substances.length).toBeGreaterThan(0);
    expect(antispasmodics?.specialites.length).toBeGreaterThan(0);
    expect(antispasmodics?.specialites.some(
      (specialite) => specialite.NomId === "40521",
    )).toBe(true);
  });
});
