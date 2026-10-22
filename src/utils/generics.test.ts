import { describe, it, expect } from "vitest";
import { getGenericGroupDescription, getGenericSlug } from "./generics";

describe("utils generics - slug", () => {
  it("builds a slug from the DCI part of the group name and the group code", () => {
    expect(getGenericSlug(2, "CIMETIDINE 200 mg - TAGAMET 200 mg, comprimé effervescent")).toBe(
      "cimetidine-200-mg-2",
    );
  });

  it("gives the same slug for the group label and the formatted list name", () => {
    expect(getGenericSlug(10, "SPIRAMYCINE 3 M.U.I. - ROVAMYCINE 3 MILLIONS U I, comprimé pelliculé.")).toBe(
      getGenericSlug(10, "Spiramycine 3 M.u.i."),
    );
  });
});

describe("utils generics - description", () => {
  const spec = (SpecDenom01: string) => ({ SpecDenom01 });

  it("describes one princeps and the number of generics", () => {
    expect(getGenericGroupDescription({
      princeps: [spec("CELEBREX 200 mg, gélule")],
      generiques: [spec("CELECOXIB BIOGARAN 200 mg, gélule"), spec("CELECOXIB EG 200 mg, gélule"), spec("CELECOXIB TEVA 200 mg, gélule")],
    })).toBe(
      "Le princeps de ce groupe générique est Celebrex 200 mg, gélule, et il comprend 3 spécialités génériques équivalentes.",
    );
  });

  it("uses the plural for several princeps and the singular for one generic", () => {
    expect(getGenericGroupDescription({
      princeps: [spec("MOPRAL 20 mg"), spec("ZOLTUM 20 mg")],
      generiques: [spec("OMEPRAZOLE BIOGARAN 20 mg")],
    })).toBe(
      "Les princeps de ce groupe générique sont Mopral 20 mg et Zoltum 20 mg, et il comprend 1 spécialité générique équivalente.",
    );
  });

  it("mentions the absence of generics", () => {
    expect(getGenericGroupDescription({ princeps: [spec("TAGAMET 200 mg")], generiques: [] })).toBe(
      "Le princeps de ce groupe générique est Tagamet 200 mg, et il ne comprend pas de spécialité générique équivalente.",
    );
  });

  it("still describes the generics of a group without princeps", () => {
    expect(getGenericGroupDescription({ princeps: [], generiques: [spec("CIMETIDINE ARROW 200 mg")] })).toBe(
      "Ce groupe générique comprend 1 spécialité générique équivalente.",
    );
  });
});
