import { describe, expect, it, vi } from "vitest";
import { getArticleLinkedEntities } from "./articles";

vi.mock("server-only", () => ({}));

describe("db utils articles - getArticleLinkedEntities", () => {
  it("links the existing pages of the site, unknown ids ignored", async () => {
    const { about, mentions } = await getArticleLinkedEntities({
      // paracétamol, twice, and an unknown substance
      substances: ["02202", "02202", "99999"],
      // DOLIPRANE 1000 mg, comprimé (visible) and DOLIPRANE 500 mg, comprimé orodispersible (not visible)
      specialites: ["60234100", "61933092"],
      // Migraine (codePatho 62)
      pathologies: ["62"],
      // ATC N02 and an unknown class
      atc: ["N02", "Z99"],
    });

    expect(about).toEqual([
      {
        type: "MedicalCondition",
        name: "Migraine",
        path: expect.stringMatching(/^\/indications\/migraine-\d+$/),
      },
      {
        type: "DrugClass",
        name: expect.any(String),
        path: expect.stringMatching(/^\/atc\/.+-n02$/),
      },
    ]);
    expect(mentions).toEqual([
      {
        type: "Drug",
        name: "paracétamol",
        path: "/substances/paracetamol-02202",
      },
      {
        type: "Drug",
        name: expect.stringMatching(/^Doliprane 1000/i),
        path: expect.stringMatching(/^\/medicaments\/.+-60234100$/),
      },
    ]);
  });
});
