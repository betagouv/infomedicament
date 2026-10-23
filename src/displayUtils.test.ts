import { describe, it, expect } from "vitest";
import { CompositionNature, type CompositionComponent } from "./types/SubstanceTypes";
import { displayCompleteComposants, formatFrenchList, formatSpecName } from "./displayUtils";

describe("formatSpecName", () => {
  it("should lowercase words that start with uppercase", () => {
    expect(formatSpecName("DOLIPRANE 1000 mg")).toBe("Doliprane 1000 mg");
  });

  it("should not crash on empty string", () => {
    expect(formatSpecName("")).toBeFalsy();
  });

  it("should not crash on undefined", () => {
    expect(formatSpecName(undefined as unknown as string)).toBeFalsy();
  });
});

describe("displayCompleteComposants", () => {
  it("omits the element dosage reference from the medicine summary", () => {
    const component: CompositionComponent = {
      SpecId: "69174918",
      ElmtNum: 1,
      ElmtOrdre: 1,
      NatuId: CompositionNature.Substance,
      CompNum: 1,
      CompOrdre: 1,
      SubsId: "34560",
      NomId: "38937",
      NomLib: "tozinaméran",
      CompDosage:
        "10 microgrammes pour une dose de 0,2 mL après dilution (un flacon contient 10 doses après dilution)",
      CompRem: "",
    };

    expect(displayCompleteComposants([component])).toBe(
      "tozinaméran (10 microgrammes)",
    );
  });
});

describe("formatFrenchList", () => {
  it("joins the last two items with \"et\"", () => {
    expect(formatFrenchList(["paracétamol"])).toBe("paracétamol");
    expect(formatFrenchList(["paracétamol", "codéine"])).toBe("paracétamol et codéine");
    expect(formatFrenchList(["paracétamol", "codéine", "caféine"])).toBe("paracétamol, codéine et caféine");
  });
});
