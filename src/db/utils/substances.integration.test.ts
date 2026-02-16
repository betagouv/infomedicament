import { describe, it, expect, vi } from "vitest";
import { getAllSubsWithSpecialites, getSubstanceAllSpecialites } from "./substances";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("db utils substances", () => {

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
});