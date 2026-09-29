import { describe, it, expect, vi } from "vitest";
import { getAllSpecialites, getDetailedSpecialite, getSpecialite, getSubstanceSpecialites, getSubstanceSpecialitesCIS, getSubstanceSpecsGroups } from "./specialities";
import { isPrincepsSpecialite } from "./generics";

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

  it("removes from a medicament group the specialites with another composition", async () => {
    // Acide fusidique (02160): FUCIDINE group also contains fusidate de sodium (04913) specialites
    const groups = await getSubstanceSpecsGroups(["02160"]);
    const fucidine = groups.find((group) => group.groupName === "FUCIDINE");

    expect(fucidine?.CISList).toEqual(["60330586"]); // FUCIDINE 2 POUR CENT, crème
    expect(fucidine?.shortSpecialites.map((spec) => spec.SpecId)).toEqual(["60330586"]);
  });

  it("removes from a medicament group the specialites with more substances", async () => {
    // Hydroxyde d'aluminium (02940): the MAALOX group mostly contains aluminium + magnésium specialites
    const groups = await getSubstanceSpecsGroups(["02940"]);
    const maalox = groups.find((group) => group.groupName === "MAALOX MAUX D'ESTOMAC HYDROXYDE D'ALUMINIUM/HYDROXYDE DE MAGNESIUM");

    expect(maalox?.CISList).toEqual(["64216427"]);
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
