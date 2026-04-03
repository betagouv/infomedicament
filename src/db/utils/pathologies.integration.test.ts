import { describe, it, expect, vi } from "vitest";
import { getAllPathoWithSpecialites, getPatho, getSpecialitePatho, getSpecialitesPatho } from "./pathologies";
import { ShortPatho } from "@/types/PathoTypes";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("db utils pathologies", () => {

  it("getAllPathoWithSpecialites - should return only patho with actives specialities", async () => {
    const allPathos = await getAllPathoWithSpecialites();

    //61933092
    const isInactiveSpec = allPathos.findIndex((patho) => patho.SpecDenom01.trim() === "DOLIPRANE 500 mg, comprimé orodispersible");
    //60234100
    const isActiveSpec = allPathos.findIndex((patho) => patho.SpecDenom01.trim() === "DOLIPRANE 1000 mg, comprimé");

    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  });

  it("getPatho - should return patho or classe clinique", async () => {
    const patho = await getPatho("1");
    expect(patho).toStrictEqual({
      "codePatho": "1",
      "NomPatho": "Acné",
    });
    const classeClinique = await getPatho("269");
    expect(classeClinique).toStrictEqual({
      "codePatho": "269",
      "NomPatho": "ALGIE VASCULAIRE DE LA FACE",
    });
  });

  it("getSpecialitePatho - should return patho and classe clinique", async () => {
    const pathos = await getSpecialitePatho("68600724");
    const isPatho = pathos.findIndex((patho: string) => patho === "10");
    expect(isPatho).not.toBe(-1);
    const isClasseClinique = pathos.findIndex((patho: string) => patho === "167");
    expect(isClasseClinique).not.toBe(-1);
  });

  it("getSpecialitesPatho - should return patho and classe clinique", async () => {
    const pathos = await getSpecialitesPatho(["68600724", "69724251"]);
    const isPatho = pathos.findIndex((patho: ShortPatho) => patho.codePatho === "10");
    expect(isPatho).not.toBe(-1);
    const isClasseClinique = pathos.findIndex((patho: ShortPatho) => patho.codePatho === "167");
    expect(isClasseClinique).not.toBe(-1);
  });
});