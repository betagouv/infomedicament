import { describe, it, expect } from "vitest";
import { getAllGenericGroupCodes, getGenericGroup, getGenericGroupMembership } from "./generics";

async function getGroupCode(CIS: string): Promise<number> {
  const membership = await getGenericGroupMembership(CIS);
  expect(membership).toBeDefined();
  return membership!.codeGroupe;
}

describe("db utils generics", () => {

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
