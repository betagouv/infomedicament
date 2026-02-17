import { describe, it, expect } from "vitest";
import { getAllPathoWithSpecialites } from "./pathologies";

describe("db utils pathologies", () => {

  it("should return only patho with actives specialities", async () => {
    const allPathos = await getAllPathoWithSpecialites();

    //61933092
    const isInactiveSpec = allPathos.findIndex((patho) => patho.SpecDenom01.trim() === "DOLIPRANE 500 mg, comprimé orodispersible");
    //60234100
    const isActiveSpec = allPathos.findIndex((patho) => patho.SpecDenom01.trim() === "DOLIPRANE 1000 mg, comprimé");

    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  })
});