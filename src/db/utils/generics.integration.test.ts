import { describe, it, expect } from "vitest";
import { getAllGenericGroupIds, getGenericGroup, getGeneriques } from "./generics";

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

  it("supports groups with multiple reference specialites", async () => {
    const group = await getGenericGroup("14");
    expect(group?.princeps.length).toBeGreaterThan(1);
  });

  it("does not invent a group for a medicine without membership", async () => {
    await expect(getGenericGroup("60009573")).resolves.toBeUndefined();
  });

  it("only emits sitemap IDs for groups with visible public members", async () => {
    const ids = await getAllGenericGroupIds();
    expect(ids).toContain("14");
    await expect(Promise.all(ids.slice(0, 25).map(getGenericGroup))).resolves
      .not.toContain(undefined);
  });
});
