import { describe, it, expect, vi } from "vitest";
import { getAllSubsWithSpecialites, getSubstanceAllSpecialites } from "./substances";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("db utils substances", () => {

  it("getAllSubsWithSpecialites - should return only subs with actives specialities", async () => {
    const allSubs = await getAllSubsWithSpecialites();

    // DOLIPRANE 500 mg, comprimé orodispersible (CIS 61933092) is inactive — must not appear
    const isInactiveSpec = allSubs.findIndex((subs) => subs.SpecDenom01?.trim() === "DOLIPRANE 500 mg, comprimé orodispersible");
    expect(isInactiveSpec).toBe(-1);

    // Function must return non-empty results (denomination format may differ between MySQL and bdpm)
    expect(allSubs.length).toBeGreaterThan(0);
  })

  it("getSubstanceAllSpecialites - should return only actives specialites", async () => {
    //Paracétamol
    const specs = await getSubstanceAllSpecialites(["02202"]);

    // DOLIPRANE 500 mg, comprimé orodispersible (CIS 61933092) is inactive — must not appear
    const isInactiveSpec = specs.findIndex((spec) => spec.denomination?.trim() === "DOLIPRANE 500 mg, comprimé orodispersible");
    expect(isInactiveSpec).toBe(-1);

    // Function must return non-empty results for paracétamol
    expect(specs.length).toBeGreaterThan(0);
  })
});