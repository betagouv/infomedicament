import { describe, it, expect } from "vitest";
import db from "@/db";
import { getAllSubsWithSpecialites, getCisMatchingSubstanceSet, getSubstancesResumeWithLetter } from "./substances";
import { getNormalizeLetter } from "@/utils/alphabeticNav";

// Substances list from the letter of this name
const getSubstancesList = async (nomLib: string) =>
  getSubstancesResumeWithLetter(getNormalizeLetter(nomLib.substring(0, 1)));

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

//run `npm run db:update-resume substances` is necessary first
describe("substances list (resume_substances)", () => {

  it("returns substance with visible specialites", async () => {
    const substances = await getSubstancesList("paracétamol");
    const paracetamol = substances.find((subs) => subs.SubsId === "02202");

    expect(paracetamol?.NomLib).toBe("paracétamol");
    expect(paracetamol?.specialites).toBeGreaterThan(0);
  });

  it("does not return the canonical names if it's not used by any specialite", async () => {
    // Nitrate d'éconazole (03929): canonical name "éconazole (nitrate d')" is not used by any specialite
    const canonicalSubstances = await getSubstancesList("éconazole (nitrate d')");
    const synonymSubstances = await getSubstancesList("nitrate d'éconazole");

    expect(canonicalSubstances.some((subs) => subs.NomLib === "éconazole (nitrate d')")).toBe(false);
    expect(synonymSubstances.some((subs) => subs.SubsId === "03929" && subs.NomLib === "nitrate d'éconazole")).toBe(true);
  });

  it("does not list substances without visible specialites", async () => {
    // Ranitidine base (49632): all its specialites are INDISPONIBLE
    const substances = await getSubstancesList("ranitidine base");
    expect(substances.some((subs) => subs.SubsId === "49632")).toBe(false);
  });

  it("lists an active fraction with specialites", async () => {
    // Escitalopram (89971) is the active fraction of escitalopram oxalate (78924)
    const fractionSubstances = await getSubstancesList("escitalopram");

    expect(fractionSubstances.some((subs) => subs.SubsId === "89971" && subs.NomLib === "escitalopram")).toBe(true);
  });

  it("does not list a substance always displayed as its active fraction, and its page has no medicament", async () => {
    // Escitalopram oxalate (78924): all its specialites are displayed as escitalopram (89971)
    const substances = await getSubstancesList("oxalate d'escitalopram");

    expect(substances.some((subs) => subs.SubsId === "78924")).toBe(false);
    expect(await getCisMatchingSubstanceSet(["78924"])).toEqual([]);
  });

  it("lists the active fraction instead of its substance", async () => {
    // Pantoprazole sodique sesquihydraté (67373): all its specialites are displayed as pantoprazole (38524)
    const substances = await getSubstancesList("pantoprazole");

    expect(substances.some((subs) => subs.SubsId === "67373")).toBe(false);
    expect(substances.some((subs) => subs.SubsId === "38524" && subs.NomLib === "pantoprazole")).toBe(true);
  });

  it("does not list a substance with combination (more than one component)", async () => {
    // Cysteine (00477) only appears in multi-component specialites
    const substances = await getSubstancesList("cystéine");
    expect(substances.some((subs) => subs.SubsId === "00477")).toBe(false);
  });

  it("lists accented names under the unaccented letter", async () => {
    const substances = await getSubstancesResumeWithLetter("E");
    expect(substances.some((subs) => subs.NomLib === "ébastine")).toBe(true);
  });

  it("decodes HTML entities in names", async () => {
    // 84495: ANSM name contains "l&rsquo;arylsulfatase"
    const substances = await getSubstancesList("population enrichie");
    const subs = substances.find((subs) => subs.SubsId === "84495");

    expect(subs?.NomLib).toContain("l’arylsulfatase");
    const withHTML = await db
      .selectFrom("resume_substances")
      .select("NomLib")
      .where("NomLib", "~", "&#?[a-zA-Z0-9]+;")
      .execute();
    expect(withHTML).toEqual([]);
  });

  it("removes double spaces in names", async () => {
    // 09692: ANSM name is "antigène  de surface de l'hépatite B recombinant  ((LEVURE/SACCHAROMYCES CEREVISIAE))"
    const substances = await getSubstancesList("antigène de surface de l'hépatite B recombinant");

    expect(substances.some((subs) => subs.SubsId === "09692" && subs.NomLib === "antigène de surface de l'hépatite B recombinant")).toBe(true);
    const withDoubleSpaces = await db
      .selectFrom("resume_substances")
      .select("NomLib")
      .where("NomLib", "~", "\\s{2,}")
      .execute();
    expect(withDoubleSpaces).toEqual([]);
  });

  it("has no duplicate SubsId / NomId couple", async () => {
    const duplicates = await db
      .selectFrom("resume_substances")
      .select(["SubsId", "NomId"])
      .groupBy(["SubsId", "NomId"])
      .having((eb) => eb.fn.countAll(), ">", 1)
      .execute();
    expect(duplicates).toEqual([]);
  });
});

describe("getCisMatchingSubstanceSet", () => {

  it("resolves SubsId before a NomId", async () => {
    // 00140 is the SubsId of "chiendent" and the NomId of "CHIENDENT OFFICINAL" (SubsId 40182)
    const CISList = await getCisMatchingSubstanceSet(["00140"]);
    expect(CISList).not.toContain("69601081"); // CIS containing only 40182
  });

  it("resolves a NomId which is not a SubsId", async () => {
    // 61187: NomId "acétaminophène" of the SubsId 02202 (paracétamol)
    const byNomId = await getCisMatchingSubstanceSet(["61187"]);
    const bySubsId = await getCisMatchingSubstanceSet(["02202"]);

    expect(byNomId.length).toBeGreaterThan(0);
    expect(byNomId.sort()).toEqual(bySubsId.sort());
  });
});
