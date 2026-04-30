import { describe, it, expect, vi } from "vitest";
import { getIndications, getSpecialiteIndications, getSpecialitePathologies, getSpecialitesIndications } from "./indications";
import { ShortIndication } from "@/types/IndicationsTypes";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("db utils indications", () => {

  it("getIndications - should return patho and / or classe clinique", async () => {
    const patho = await getIndications(1);
    expect(patho).toBeDefined();
    if(patho) {
      expect(patho.codePatho).toBe(1);
      expect(patho.codeClasseClinique).toBe(20);
    }
    const classeClinique = await getIndications(172);
    expect(classeClinique).toBeDefined();
    if(classeClinique) {
      expect(classeClinique.codePatho).toBeNull();
      expect(classeClinique.codeClasseClinique).toBe(65);
    }
  });

  it("getSpecialiteIndications - should return patho and / or classe clinique", async () => {
    const indications = await getSpecialiteIndications("68600724");
    const isPatho = indications.findIndex((indication: number) => indication === 99);
    expect(isPatho).not.toBe(-1);
    const isClasseClinique = indications.findIndex((indication: number) => indication === 236);
    expect(isClasseClinique).not.toBe(-1);
  });

  it("getSpecialitesIndications - should return patho and / or classe clinique", async () => {
    const indications = await getSpecialitesIndications(["68600724", "69724251"]);
    const isPatho = indications.findIndex((indication: ShortIndication) => indication.idIndication === 99);
    expect(isPatho).not.toBe(-1);
    const isClasseClinique = indications.findIndex((indication: ShortIndication) => indication.idIndication === 236);
    expect(isClasseClinique).not.toBe(-1);
  });

  it("getSpecialitePathologies - should return only patho", async () => {
    const pathos = await getSpecialitePathologies("68600724");
    const isPatho = pathos.findIndex((patho: number) => patho === 10);
    expect(isPatho).not.toBe(-1);
    const isClasseClinique = pathos.findIndex((patho: number) => patho === 13);
    expect(isClasseClinique).toBe(-1);
  });
});