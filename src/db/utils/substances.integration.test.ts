import { describe, it, expect, vi } from "vitest";
import { getAllSubsWithSpecialites, getSubstanceAllSpecialites, getSubstances } from "./substances";

// disable cache for testing
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

describe("db utils substances", () => {
  it.each([
    ["00005", "34911"], // Aspirin synonyms share a substance code.
    ["17407", "96973"], // Esomeprazole and its salt share a component.
  ])("preserves batched speciality matches for %s and %s", async (...ids) => {
    const individually = await Promise.all(
      ids.map((id) => getSubstanceAllSpecialites([id])),
    );
    const batched = await getSubstanceAllSpecialites(ids);
    const reversed = await getSubstanceAllSpecialites([...ids].reverse());

    ids.forEach((id, index) => {
      const expectedCis = individually[index].map((s) => s.SpecId).sort();
      expect(expectedCis.length).toBeGreaterThan(0);
      for (const result of [batched, reversed]) {
        expect(result.filter((s) => s.NomId === id).map((s) => s.SpecId).sort())
          .toEqual(expectedCis);
      }
    });
  });

  it("getAllSubsWithSpecialites - should return only subs with actives specialities", async () => {
    const allSubs = await getAllSubsWithSpecialites();

    //61933092
    const isInactiveSpec = allSubs.findIndex((subs) => subs.SpecDenom01.trim() === "DOLIPRANE 500 mg, comprimé orodispersible");
    //60234100
    const isActiveSpec = allSubs.findIndex((subs) => subs.SpecDenom01.trim() === "DOLIPRANE 1000 mg, comprimé");

    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  })

  it("getSubstanceAllSpecialites - should return only actives specialites", async () => {
    //Paracétamol
    const specs = await getSubstanceAllSpecialites(["02202"]);

    //61933092
    const isInactiveSpec = specs.findIndex((spec) => spec.SpecDenom01.trim() === "DOLIPRANE 500 mg, comprimé orodispersible");
    //60234100
    const isActiveSpec = specs.findIndex((spec) => spec.SpecDenom01.trim() === "DOLIPRANE 1000 mg, comprimé");

    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  })
  it("keeps canonical and synonym public IDs addressable", async () => {
    const substances = await getSubstances(["00005", "34911"]);
    expect(substances.map((substance) => substance.NomId)).toEqual(["00005", "34911"]);
    expect(substances[1].NomLib).toBe("acide acétylsalicylique");
  });
});
