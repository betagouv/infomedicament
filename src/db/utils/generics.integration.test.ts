import { describe, it, expect } from "vitest";
import { getGeneriques, getGroupeGene, getIsPrinceps } from "./generics";

describe("db utils generics", () => {

  it("getGeneriques - should return only actives specialities", async () => {
    //Abacavir (SULFATE D') équivalant à Abacavir 300 mg
    const generiques = await getGeneriques("68556562");

    //Abacavir Dextreg 300 mg, comprimé pelliculé sécable
    const isInactiveSpec = generiques.findIndex((spec) => spec.SpecId.trim() === "61679174");
    //Abacavir Arrow 300 mg, comprimé pelliculé sécable
    const isActiveSpec = generiques.findIndex((spec) => spec.SpecId.trim() === "61876780"); 

    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  });

  it("getGroupeGene - should return only actives generiques", async () => {
    //Tramadol (CHLORHYDRATE De) 37,5 mg + Paracétamol 325 mg
    const groups = await getGroupeGene("60327615");
    expect(groups.length).toBe(2);

    //Abacavir (SULFATE D') équivalant à Abacavir 300 mg
    const groups2 = await getGroupeGene("68556562");
    expect(groups2.length).toBe(1);
  });

  it("getIsPrinceps", async () => {
    //All the tests are for the same group : Tramadol (CHLORHYDRATE De) 37,5 mg + Paracétamol 325 mg
    const isPrinceps = await getIsPrinceps("60327615");
    expect(isPrinceps).toBe(true);
    const isPrinceps2 = await getIsPrinceps("61137241");
    expect(isPrinceps2).toBe(true);
    const isPrinceps3 = await getIsPrinceps("63561242");
    expect(isPrinceps3).toBe(false);
    const isPrinceps4 = await getIsPrinceps("69925400");
    expect(isPrinceps4).toBe(false);
  });

});