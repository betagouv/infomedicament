import { describe, it, expect, vi } from "vitest";
import { getPatho, getSpecialitePatho, getSpecialitesPatho } from "./pathologies";
import { ShortPatho } from "@/types/PathoTypes";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("db utils pathologies", () => {

  it("getPatho - should return patho and / or classe clinique", async () => {
    const patho = await getPatho(1);
    expect(patho).toBeDefined();
    if(patho) {
      expect(patho.codePatho).toBe(1);
      expect(patho.codeClasseClinique).toBe(20);
    }
    const classeClinique = await getPatho(172);
    expect(classeClinique).toBeDefined();
    if(classeClinique) {
      expect(classeClinique.codePatho).toBeNull();
      expect(classeClinique.codeClasseClinique).toBe(65);
    }
  });

  it("getSpecialitePatho - should return patho and / or classe clinique", async () => {
    const pathos = await getSpecialitePatho("68600724");
    const isPatho = pathos.findIndex((patho: number) => patho === 99);
    expect(isPatho).not.toBe(-1);
    const isClasseClinique = pathos.findIndex((patho: number) => patho === 236);
    expect(isClasseClinique).not.toBe(-1);
  });

  it("getSpecialitesPatho - should return patho and / or classe clinique", async () => {
    const pathos = await getSpecialitesPatho(["68600724", "69724251"]);
    const isPatho = pathos.findIndex((patho: ShortPatho) => patho.idPatho === 99);
    expect(isPatho).not.toBe(-1);
    const isClasseClinique = pathos.findIndex((patho: ShortPatho) => patho.idPatho === 236);
    expect(isClasseClinique).not.toBe(-1);
  });
});