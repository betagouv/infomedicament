import { describe, expect, it, vi } from "vitest";
import { getAtc1, getAtc1DefinitionData, getAtc2, getSubstancesByAtc } from "./atc";
import { getSubstancesResume } from "./substances";


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
