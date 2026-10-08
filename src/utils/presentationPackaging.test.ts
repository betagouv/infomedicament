import { describe, expect, it, vi } from "vitest";
import snapshot from "@/testsUtils/fixtures/ansm-packaging.json";
import { Presentation } from "@/types/PresentationTypes";
import { getPresentationsDetails } from "@/db/utils/presentation";
import { cleanPresentationsDetails, getPresentationName } from "./presentations";

// Replay source rows through the production adapter, including its characteristic/device fan-out.
vi.mock("@/db", () => ({ default: {
  selectFrom: (table: keyof typeof snapshot | "ansm_presentation") => {
    let rows = snapshot[table === "ansm_presentation" ? "presentations" : table] as Record<string, unknown>[];
    const query = {
      where: (column: string, operator: string, values: string[]) => {
        rows = rows.filter((row) => operator === "in" && values.includes(row[column] as string));
        return query;
      },
      select: () => query,
      selectAll: () => query,
      execute: async () => rows,
    };
    return query;
  },
} }));
vi.mock("@/db/pdbmMySQL", () => ({ pdbmMySQL: {} }));

async function presentations() {
  const details = await getPresentationsDetails(snapshot.presentations.map(({ cip }) => cip));
  return snapshot.presentations.map((row) => ({
    cis: row.cis, cip13: row.cip, name: row.denomination,
    details: details.filter((detail) => detail.codecip13 === row.cip),
  } as Presentation));
}

describe("source packaging fidelity", () => {
  it("retains glass despite characteristic rows repeated for each device", async () => {
    const rows = await presentations();
    const p = rows.find(({ cip13 }) => cip13 === "3400930317815")!;
    expect(cleanPresentationsDetails(p.details!)[0].recipients[0].caraccomplrecips)
      .toContainEqual({ caraccomplrecip: "en verre", numordreedit: 1 });
  });

  it("preserves Wegovy glass, pen and four needles for both volumes", async () => {
    const rows = await presentations();
    for (const cip of ["3400930258637", "3400930317815"]) {
      const p = rows.find(({ cip13 }) => cip13 === cip)!;
      expect(getPresentationName(p)).toContain("en verre");
      expect(p.details!.some(({ dispositif }) => dispositif === "avec 4 aiguilles")).toBe(true);
      expect(getPresentationName(p)).toContain("stylo prérempli + 4 aiguilles");
      expect(getPresentationName(p)).toContain(cip === "3400930258637" ? "1,5 mL" : "3 mL");
    }
  });

  it("retains accessories even when device rows are missing", async () => {
    const p = (await presentations()).find(({ cip13 }) => cip13 === "3400930317815")!;
    p.details = p.details!.map((detail) => ({ ...detail, numdispositif: 0, dispositif: "" }));
    expect(getPresentationName(p)).toContain("+ 4 aiguilles");
  });

  it("preserves Ponvory PET and the source initiation pack composition", async () => {
    const rows = await presentations();
    const standard = rows.find(({ cis }) => cis === "62056415")!;
    const initiation = rows.find(({ cis }) => cis === "61715282")!;
    expect(getPresentationName(standard)).toContain("polytéréphtalate (PET) de 28 comprimés");
    expect(getPresentationName(initiation)).toContain("Pack d’initiation 14 comprimés");
    expect(getPresentationName(initiation)).toContain("1 x 5 mg");
    expect(getPresentationName(initiation)).toContain("3 x 10 mg");
    expect(getPresentationName(initiation)).toContain("(PET)");
  });
  it("keeps twelve needles on the three-cartridge Wegovy pack", async () => {
    const p = (await presentations()).find(({ cip13 }) => cip13 === "3400955090724")!;
    expect(getPresentationName(p)).toBe("3 cartouches en verre de 3 mL dans stylos préremplis + 12 aiguilles");
    expect(p.details!.some(({ dispositif }) => dispositif === "avec 12 aiguilles")).toBe(true);
  });

  it("corrects a single measured volume without losing source accessories", async () => {
    const p = (await presentations()).find(({ cip13 }) => cip13 === "3400930258637")!;
    p.name = p.name!.replace("1,5 mL", "45778 mL");
    expect(getPresentationName(p)).toBe("1 cartouche en verre de 1,5 mL dans stylo prérempli + 4 aiguilles");
  });

  it("does not guess which of two measured quantities to correct", async () => {
    const p = (await presentations()).find(({ cip13 }) => cip13 === "3400930258637")!;
    p.name = "1 cartouche en verre de 3 mL avec flacon de 5 mL";
    expect(getPresentationName(p)).toBe(p.name);
  });

  it("does not replace a quantity belonging to an accessory", async () => {
    const p = (await presentations()).find(({ cip13 }) => cip13 === "3400930258637")!;
    p.name = "1 cartouche en verre avec flacon de 5 mL";
    expect(getPresentationName(p)).toBe(p.name);
  });

  it("keeps devices attached to their source recipient", async () => {
    const p = (await presentations()).find(({ cis }) => cis === "64460075")!;
    expect(getPresentationName(p)).toBe("1 flacon en verre de 4 ml - 1 ampoule en verre avec seringue avec aiguille de 2 ml");
  });

  it("resets optional plurals for each recipient", async () => {
    const p = (await presentations()).find(({ cis }) => cis === "64460075")!;
    p.name = "plaquette(s) de 12 comprimé(s) - plaquette(s) de 4 comprimé(s)";
    expect(getPresentationName(p)).toBe("plaquette de 12 comprimés - plaquette de 4 comprimés");
  });

  it("reconstructs from rows when the source name is unavailable", async () => {
    const p = (await presentations()).find(({ cip13 }) => cip13 === "3400930317815")!;
    p.name = null;
    expect(getPresentationName(p)).toBe("1 cartouche en verre de 3 ml dans stylo pré-rempli avec 4 aiguilles");
  });

  it("matches material acronyms and spacing without accepting unrelated characteristics", async () => {
    const p = (await presentations()).find(({ cis }) => cis === "62056415")!;
    const clean = cleanPresentationsDetails(p.details!)[0].recipients[0];
    expect(clean.caraccomplrecips).toContainEqual({ caraccomplrecip: "polyéthylène téréphtalate (PET)", numordreedit: 4 });
    const detail = { ...p.details![0], nom_presentation: "plaquette OPA :   polyamide orienté", caraccomplrecip: "OPA : polyamide orienté" };
    expect(cleanPresentationsDetails([detail])[0].recipients[0].caraccomplrecips).toHaveLength(1);
    detail.caraccomplrecip = "en verre";
    expect(cleanPresentationsDetails([detail])[0].recipients[0].caraccomplrecips).toHaveLength(0);
  });

  it("preserves source details across all 23 CIS codes", async () => {
    const rows = await presentations();
    expect(new Set(rows.map(({ cis }) => cis)).size).toBe(23);
    expect(rows).toHaveLength(49);
    for (const p of rows) {
      // Only optional plurals, whitespace, and a broken source apostrophe may change.
      const normalize = (text: string) => text.toLowerCase().replaceAll("(s)", "s")
        .replaceAll("\u001a", "’").replace(/\s+/g, " ").trim();
      const after = normalize(getPresentationName(p));
      for (const token of normalize(p.name!).split(/[^\p{L}\d]+/u).filter(Boolean)) {
        expect(after, `CIS ${p.cis}, CIP ${p.cip13}: ${token}`).toContain(token.endsWith("s") ? token.slice(0, -1) : token);
      }
    }
  });
});
