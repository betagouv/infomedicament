import { describe, expect, it } from "vitest";
import { buildIndications } from "./indicationCatalog";

describe("buildIndications", () => {
  it("maps specialities to pathologies through their clinical class", () => {
    const rows = buildIndications({
      pathologies: [{ code: 10, nom: "Douleur" }],
      clinicalClasses: [{ code: 20, name: "ANTALGIQUES" }],
      specialiteClasses: [{ cis: "60000001", classCode: 20 }],
      classPathologies: [{ classCode: 20, pathologyCode: 10 }],
      definitions: [],
    }, []);

    expect(rows).toEqual([
      {
        codePatho: 10,
        codeClasseClinique: undefined,
        nom: "Douleur",
        definition: undefined,
        CIS: ["60000001"],
      },
      {
        codePatho: undefined,
        codeClasseClinique: 20,
        nom: "Antalgiques",
        definition: undefined,
        CIS: ["60000001"],
      },
    ]);
  });
});
