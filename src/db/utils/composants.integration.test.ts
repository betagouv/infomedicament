import { describe, expect, it } from "vitest";
import { displayCompleteComposants, displaySimpleComposants } from "@/displayUtils";
import { CompositionNature } from "@/types/SubstanceTypes";
import { getComposants } from "./composants";

describe("PostgreSQL medicine composition", () => {
  it("preserves a substance and its active fraction", async () => {
    const components = await getComposants("62998997");
    const phloroglucinol = components.filter((component) => component.CompNum === 2);

    expect(phloroglucinol).toHaveLength(2);
    expect(phloroglucinol.map((component) => component.NatuId)).toEqual([
      CompositionNature.Fraction,
      CompositionNature.Substance,
    ]);
    expect(displaySimpleComposants(components).map((substance) => substance.NomId))
      .toEqual(["40521", "92651"]);
    expect(displayCompleteComposants(components)).toContain(
      "phloroglucinol anhydre (31,12 mg) sous forme de phloroglucinol hydraté",
    );
  });

  it("preserves order for a multi-substance medicine", async () => {
    const components = await getComposants("60009573");
    expect(components.map((component) => component.CompNum)).toEqual([1, 2]);
    expect(components.map((component) => component.NomId)).toEqual(["02202", "90530"]);
  });

  it("does not merge equal component orders across elements", async () => {
    const components = await getComposants("60134573");
    const keys = new Set(components.map((component) =>
      `${component.ElmtNum}:${component.CompNum}`,
    ));
    expect(keys.size).toBe(2);
    expect(displaySimpleComposants(components)).toHaveLength(2);
  });
});
