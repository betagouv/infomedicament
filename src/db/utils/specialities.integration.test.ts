import { describe, it, expect, vi } from "vitest";
import { getAllSpecialites, getDetailedSpecialite, getSpecialite, getSubstanceSpecialitesCIS, getSubstanceSpecsGroups } from "./specialities";
import { isPrincepsSpecialite } from "./generics";
import { isHospitalDelivrance } from "@/utils/specialites";
import db from "@/db";

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

  it("reads delivery conditions and hospital use from PostgreSQL", async () => {
    const { delivrance } = await getSpecialite("60199966");

    expect(delivrance).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 120, longLabel: "liste I" }),
      expect.objectContaining({ code: 3, longLabel: "réservé à l'usage HOSPITALIER" }),
    ]));
    expect(isHospitalDelivrance(delivrance)).toBe(true);
  });

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

  it("requires the complete requested substance set", async () => {
    const paracetamolOnly = await getSubstanceSpecialitesCIS("02202");
    const paracetamolAndCodeine = await getSubstanceSpecialitesCIS(["02202", "90530"]);

    expect(paracetamolOnly).not.toContain("60009573");
    expect(paracetamolAndCodeine).toContain("60009573");
  });

  it("maps a partially available medicine to the public unavailable warning", async () => {
    const specialite = await getDetailedSpecialite("61651634");

    expect(specialite?.StatutBdm).toBe(2);
  });

  it("does not treat non-reference generic-group members as princeps", async () => {
    expect(await isPrincepsSpecialite("66663761")).toBe(false);
    expect(await isPrincepsSpecialite("64783769")).toBe(false);
  });

  it("identifies a princeps through its generic-group role", async () => {
    expect(await isPrincepsSpecialite("67541600")).toBe(true);
  });

  it("uses textual procedure values", async () => {
    expect((await getDetailedSpecialite("60928110"))?.ProcId).toBe("IMPORTATION_PARALLELE");
    expect((await getDetailedSpecialite("60123598"))?.ProcId).toBe("HOMEOPATHIQUE_NATIONALE");
  });

  it("uses the authorization abrogation event date", async () => {
    const firstDate = (await getDetailedSpecialite("65701038"))?.SpecStatDate;
    const secondDate = (await getDetailedSpecialite("69174918"))?.SpecStatDate;

    expect(firstDate?.getFullYear()).toBe(2021);
    expect(firstDate?.getMonth()).toBe(9);
    expect(firstDate?.getDate()).toBe(22);
    expect(secondDate?.getFullYear()).toBe(2025);
    expect(secondDate?.getMonth()).toBe(6);
    expect(secondDate?.getDate()).toBe(25);
  });
});

describe("substance page : specialites list", () => {
  const getGroupsCIS = async (subsIds: string[]) =>
    (await getSubstanceSpecsGroups(subsIds)).flatMap((group) => group.CISList);

  it("one substance: returns only the specialites with this substance alone", async () => {
    // Paracétamol (02202)
    const CISList = await getGroupsCIS(["02202"]);

    expect(CISList).toContain("60025403"); // CLARADOL 500 mg (paracétamol)
    expect(CISList).not.toContain("60009573"); // CLARADOL CODEINE (paracétamol + codéine)
    expect(CISList).not.toContain("61076468"); // CEFALINE HAUTH (paracétamol + caféine)
  });

  it("one substance: does not return the specialites containing it several times", async () => {
    // Tolvaptan (16736): JINARC 30 mg + JINARC 60 mg is a kit of two tolvaptan tablets
    const CISList = await getGroupsCIS(["16736"]);

    expect(CISList).toContain("66056341"); // JINARC 30 mg
    expect(CISList).not.toContain("68174566"); // JINARC 30 mg + JINARC 60 mg
  });

  it("several substances: returns the specialites with all of them, and no other", async () => {
    // Paracétamol (02202) + codéine phosphate hémihydraté (74765)
    const CISList = await getGroupsCIS(["02202", "74765"]);

    expect(CISList).toContain("60009573"); // CLARADOL CODEINE 500 mg/20 mg
    expect(CISList).not.toContain("60025403"); // CLARADOL 500 mg (paracétamol only)
    expect(CISList).not.toContain("61644230"); // PARACETAMOL/CAFEINE/CODEINE ARROW (+ caféine)
  });

  it("several substances: does not depend on the order of the substances", async () => {
    const CISList = await getGroupsCIS(["02202", "74765"]);
    const reversedCISList = await getGroupsCIS(["74765", "02202"]);

    expect(reversedCISList.sort()).toEqual(CISList.sort());
  });

  it("same substance twice: returns the specialites containing it twice", async () => {
    // Link of the substance tag on the kit page: /substances/16736,16736
    const CISList = await getGroupsCIS(["16736", "16736"]);

    expect(CISList).toContain("68174566"); // JINARC 30 mg + JINARC 60 mg
    expect(CISList).not.toContain("66056341"); // JINARC 30 mg
  });

  it("removes from a medicament group the specialites with another composition", async () => {
    // Acide fusidique (02160): FUCIDINE group also contains fusidate de sodium (04913) specialites
    const groups = await getSubstanceSpecsGroups(["02160"]);
    const fucidine = groups.find((group) => group.groupName === "FUCIDINE");

    expect(fucidine?.CISList).toEqual(["60330586"]); // FUCIDINE 2 POUR CENT, crème
    expect(fucidine?.shortSpecialites.map((spec) => spec.SpecId)).toEqual(["60330586"]);
  });

  it("removes from a medicament group the specialites with other substances", async () => {
    // Caféine + paracétamol (00420, 02202): the CLARADOL group also contains paracétamol only specialites
    const groups = await getSubstanceSpecsGroups(["00420", "02202"]);
    const claradol = groups.find((group) => group.groupName === "CLARADOL");

    expect(claradol?.CISList).toEqual(["63332717"]); // CLARADOL 500 mg CAFEINE, comprimé
    expect(claradol?.composants).toBe("caféine, paracétamol");
  });

  it("displays the actives substances from the specialites kept", async () => {
    // Paracétamol (02202): the CLARADOL group starts with "CLARADOL 500 mg CAFEINE" (caféine + paracétamol)
    const groups = await getSubstanceSpecsGroups(["02202"]);
    const claradol = groups.find((group) => group.groupName === "CLARADOL");

    expect(claradol?.CISList).toEqual(["67458001"]); // CLARADOL 500 mg, comprimé sécable
    expect(claradol?.composants).toBe("paracétamol");
    expect(claradol?.subsIds).toEqual(["02202"]);
  });
});

//run `npm run db:update-resume substances` is necessary first
describe("substance page and substances list: substances displayed on the medicaments", () => {
  // Medicaments groups on the substance page
  const getPageMedicaments = async (subsIds: string[]) => (await getSubstanceSpecsGroups(subsIds)).length;
  // Medicaments groups of the substance in the substances list, undefined if not in the list
  const getListMedicaments = async (subsId: string) => {
    const row = await db
      .selectFrom("resume_substances")
      .where("SubsId", "=", subsId)
      .select("specialites")
      .executeTakeFirst();
    return row?.specialites;
  };

  // Substance page with several substances
  it.each([
    // sacubitril + valsartan
    [["78789", "15734"], 1],
    // paracétamol + phosphate de codéine hémihydraté
    [["02202", "74765"], 8],
    // paracétamol + phosphate de codéine anhydre
    [["02202", "25936"], 1],
    // paracétamol + codéine
    [["02202", "00467"], 3],
    // glutamine + alanine: DIPEPTIVEN
    [["02725", "00031"], 1],
    // paracétamol twice + chlorhydrate de diphénhydramine
    [["02202", "02202", "02678"], 1],
  ])("page %j: %i medicament(s)", async (subsIds, nbMedicaments) => {
    expect(await getPageMedicaments(subsIds)).toBe(nbMedicaments);
  });

  // Substance page and substances list with a single substance
  it.each([
    // sacubitril: only with valsartan
    ["78789", 0],
    // valsartan
    ["15734", 13],
    // paracétamol
    ["02202", 58],
    // phosphate de codéine hémihydraté: displayed as its active fraction codéine
    ["74765", 0],
    // phosphate de codéine anhydre: displayed as its active fraction codéine
    ["25936", 0],
    // codéine
    ["00467", 2],
    // N(2)-L-alanyl-L-glutamine: displayed as its active fractions glutamine and alanine
    ["89263", 0],
    // glutamine: only with alanine
    ["02725", 0],
    // alanine
    ["00031", 1],
    // estradiol anhydre: no ANSM name
    ["63787", 3],
  ])("substance %s: %i medicament(s), in the substances list if any", async (subsId, nbMedicaments) => {
    expect(await getPageMedicaments([subsId])).toBe(nbMedicaments);
    expect(await getListMedicaments(subsId)).toBe(nbMedicaments > 0 ? nbMedicaments : undefined);
  });
});
