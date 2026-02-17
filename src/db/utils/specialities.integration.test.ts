import { describe, it, expect, vi } from "vitest";
import { getAllSpecialites, getDetailedSpecialite, getSpecialite, getSubstanceSpecialites, getSubstanceSpecialitesCIS } from "./specialities";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("db utils specialities", () => {

  it("getAllSpecialites - should return only actives specialities", async () => {
    const allSpecs = await getAllSpecialites();

    //DOLIPRANE 500 mg, comprimé orodispersible
    const isInactiveSpec = allSpecs.findIndex((spec) => spec.SpecId.trim() === "61933092");
    //DOLIPRANE 1000 mg, comprimé
    const isActiveSpec = allSpecs.findIndex((spec) => spec.SpecId.trim() === "60234100"); 

    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  })

  it("getDetailedSpecialite - should return only active specialite", async () => {
    const inactiveSpec = await getDetailedSpecialite("61933092");
    expect(inactiveSpec).toBeUndefined();

    const activeSpec = await getDetailedSpecialite("60234100");
    expect(activeSpec).not.toBeUndefined();
  })

  it("getSpecialite - should not return data for inactive specialite", async () => {
    const { specialite, composants, presentations, delivrance } =
        await getSpecialite("61933092");
    expect(specialite).toBeUndefined();
    expect(composants).toHaveLength(0);
    expect(presentations).toHaveLength(0);
    expect(delivrance).toHaveLength(0);
  })

  it("getSpecialite - should return data for active specialite", async () => {
    //Spasfon, solution injectable en ampoule
    const { specialite, composants, presentations, delivrance } =
        await getSpecialite("62998997");
    expect(specialite).toBeDefined();
    expect(composants).not.toHaveLength(0);
    expect(presentations).not.toHaveLength(0);
    expect(delivrance).not.toHaveLength(0);
  })

  it("getSubstanceSpecialitesCIS - should return CIS only with actives specialities", async () => {
    //Paracétamol
    const CISList = await getSubstanceSpecialitesCIS("02202");

    //DOLIPRANE 500 mg, comprimé orodispersible
    const isInactiveSpec = CISList.findIndex((CIS) => CIS.trim() === "61933092");
    //DOLIPRANE 1000 mg, comprimé
    const isActiveSpec = CISList.findIndex((CIS) => CIS.trim() === "60234100"); 
    
    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  })

  it("getSubstanceSpecialites - should return only actives specialities", async () => {
    //Paracétamol
    const specs = await getSubstanceSpecialites("02202");

    //DOLIPRANE 500 mg, comprimé orodispersible
    const isInactiveSpec = specs.findIndex((spec) => spec.SpecId.trim() === "61933092");
    //DOLIPRANE 1000 mg, comprimé
    const isActiveSpec = specs.findIndex((spec) => spec.SpecId.trim() === "60234100"); 
    
    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  })
});