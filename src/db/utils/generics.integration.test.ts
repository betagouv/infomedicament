import { describe, it, expect } from "vitest";
import db from "..";
import {
  getAllGenericGroupCodes,
  getGenericGroup,
  getGenericGroupMembership,
  getGenericGroupsLabelsByCIS,
  getGeneriques,
} from "./generics";

async function getGroupCode(CIS: string): Promise<number> {
  const membership = await getGenericGroupMembership(CIS);
  expect(membership).toBeDefined();
  return membership!.codeGroupe;
}

describe("db utils generics", () => {

  it("getGeneriques - should return only actives specialities", async () => {
    //Abacavir (SULFATE D') équivalant à Abacavir 300 mg
    const generiques = await getGeneriques(await getGroupCode("68556562"));

    //Abacavir Dextreg 300 mg, comprimé pelliculé sécable
    const isInactiveSpec = generiques.findIndex((spec) => spec.SpecId.trim() === "61679174");
    //Abacavir Arrow 300 mg, comprimé pelliculé sécable
    const isActiveSpec = generiques.findIndex((spec) => spec.SpecId.trim() === "61876780"); 

    expect(isInactiveSpec).toBe(-1);
    expect(isActiveSpec).not.toBe(-1);
  })

  it("identifies the reference specialite from its group role", async () => {
    const group = await getGenericGroup(await getGroupCode("68556562"));

    expect(group?.princeps.map(({ SpecId }) => SpecId)).toContain("68556562");
    expect(group?.generiques.map(({ SpecId }) => SpecId)).toContain("61876780");
  });

  it("supports groups with multiple reference specialites", async () => {
    const group = await getGenericGroup(14);
    expect(group?.princeps.length).toBeGreaterThan(1);
  });

  it("only emits sitemap IDs for groups with visible public members", async () => {
    const ids = await getAllGenericGroupCodes();
    expect(ids).toContain("14");
    await expect(Promise.all(ids.slice(0, 25).map(getGenericGroup))).resolves
      .not.toContain(undefined);
  });
});

describe("getGenericGroupsLabelsByCIS", () => {
  it("returns an empty object for an empty list", async () => {
    expect(await getGenericGroupsLabelsByCIS([])).toEqual({});
  });

  it("returns nothing for an unknown CIS", async () => {
    expect(await getGenericGroupsLabelsByCIS(["00000000"])).toEqual({});
  });

  it("returns the label of the generic group", async () => {
    const row = await db
      .selectFrom("ansm_specialite_groupe_generique")
      .innerJoin(
        "ansm_groupe_generique",
        "ansm_groupe_generique.code_groupe",
        "ansm_specialite_groupe_generique.code_groupe",
      )
      .select(["ansm_specialite_groupe_generique.cis", "ansm_groupe_generique.libelle"])
      .where("ansm_groupe_generique.libelle", "is not", null)
      .limit(1)
      .executeTakeFirstOrThrow();
    const cis = row.cis.trim();
    const labels = await getGenericGroupsLabelsByCIS([cis]);
    expect(labels[cis].split(" ; ")).toContain(row.libelle!.trim());
  });

  it("joins the labels when a CIS belongs to several groups", async () => {
    const row = await db
      .selectFrom("ansm_specialite_groupe_generique")
      .select("cis")
      .groupBy("cis")
      .having((eb) => eb.fn.countAll(), ">", 1)
      .limit(1)
      .executeTakeFirst();
    if (!row) return;
    const cis = row.cis.trim();
    const labels = await getGenericGroupsLabelsByCIS([cis]);
    expect(labels[cis].split(" ; ").length).toBeGreaterThan(1);
  });

  it("returns one entry per CIS", async () => {
    const rows = await db
      .selectFrom("ansm_specialite_groupe_generique")
      .select("cis")
      .distinct()
      .limit(5)
      .execute();
    const cisList = rows.map((r) => r.cis.trim());
    const labels = await getGenericGroupsLabelsByCIS([...cisList, "00000000"]);
    expect(Object.keys(labels).sort()).toEqual([...cisList].sort());
  });
});
