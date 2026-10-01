import { describe, it, expect, vi } from "vitest";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

import { getAllPediatrics, getPediatrics } from "./pediatrics";

describe("getAllPediatrics", () => {
  it("returns all pediatrics records", async () => {
    const all = await getAllPediatrics();
    const cisList = all.map((entry) => entry.CIS);

    //FAMOTIDINE EG 20 mg, comprimé pelliculé
    expect(cisList).toContain("60005856");
    //CLARITHROMYCINE ARROW LAB 250 mg, comprimé pelliculé
    expect(cisList).not.toContain("61521943");
  });
});

describe("getPediatrics", () => {
  it("returns undefined if no pediatrics informations", async () => {
    //CLARITHROMYCINE ARROW LAB 250 mg, comprimé pelliculé
    const result = await getPediatrics("61521943");
    expect(result).toBeUndefined();
  });

  it("returns the contraindication for a CIS", async () => {
    //FAMOTIDINE EG 20 mg, comprimé pelliculé
    const result = await getPediatrics("60005856");
    expect(result).toEqual({ contraindication: true });
  });
});
