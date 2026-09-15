import { describe, it, expect } from "vitest";
import { getGenericGroup, getGeneriques } from "./generics";

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
  })

  it("identifies the reference specialite from its group role", async () => {
    const group = await getGenericGroup("68556562");

    expect(group?.princeps.map(({ SpecId }) => SpecId)).toContain("68556562");
    expect(group?.generiques.map(({ SpecId }) => SpecId)).toContain("61876780");
  });

  it("keeps notable excipients on generic-group members", async () => {
    const group = await getGenericGroup("64976070");
    const princeps = group?.princeps.find(({ SpecId }) => SpecId === "64976070");

    expect(princeps?.Een).toBeTruthy();
  });
});
