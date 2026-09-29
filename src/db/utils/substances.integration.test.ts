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
    // Venlafaxine chlorhydrate (20256): canonical name "venlafaxine (chlorhydrate de)" is not used by any specialite
    const canonicalSubstances = await getSubstancesList("venlafaxine (chlorhydrate de)");
    const synonymSubstances = await getSubstancesList("chlorhydrate de venlafaxine");

    expect(canonicalSubstances.some((subs) => subs.NomLib === "venlafaxine (chlorhydrate de)")).toBe(false);
    expect(synonymSubstances.some((subs) => subs.SubsId === "20256" && subs.NomLib === "chlorhydrate de venlafaxine")).toBe(true);
  });

  it("does not list substances without visible specialites", async () => {
    // Ranitidine base (49632): all its specialites are INDISPONIBLE
    const substances = await getSubstancesList("ranitidine base");
    expect(substances.some((subs) => subs.SubsId === "49632")).toBe(false);
  });

  it("lists an active fraction with specialites and their substances", async () => {
    // Escitalopram (89971) is the active fraction of escitalopram oxalate (78924)
    const fractionSubstances = await getSubstancesList("escitalopram");
    const substances = await getSubstancesList("oxalate d'escitalopram");

    expect(fractionSubstances.some((subs) => subs.SubsId === "89971" && subs.NomLib === "escitalopram")).toBe(true);
    expect(substances.some((subs) => subs.SubsId === "78924")).toBe(true);
  });

  it("lists a substance without canonical name under its used synonym", async () => {
    // Pantoprazole sodium sesquihydrate (67373) has no CANONIQUE name in ansm_substance_nom
    const substances = await getSubstancesList("pantoprazole sodique sesquihydraté");
    expect(substances.some((subs) => subs.SubsId === "67373" && subs.NomLib === "pantoprazole sodique sesquihydraté")).toBe(true);
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
    // 15285: ANSM name is "pixantrone  (dimaléate de)"
    const substances = await getSubstancesList("pixantrone");

    expect(substances.some((subs) => subs.SubsId === "15285" && subs.NomLib === "pixantrone (dimaléate de)")).toBe(true);
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
    // 20260: NomId "oxalate d'escitalopram" of the SubsId 78924
    const byNomId = await getCisMatchingSubstanceSet(["20260"]);
    const bySubsId = await getCisMatchingSubstanceSet(["78924"]);

    expect(byNomId.length).toBeGreaterThan(0);
    expect(byNomId.sort()).toEqual(bySubsId.sort());
  });
});
