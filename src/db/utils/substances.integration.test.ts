import { describe, it, expect } from "vitest";
import { getAllSubsWithSpecialites } from "./substances";

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
});
