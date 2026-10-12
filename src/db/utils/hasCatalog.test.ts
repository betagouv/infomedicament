import { describe, expect, it } from "vitest";
import { mapAsmr, mapSmr, parseHasDate, sortHasHistory } from "./hasCatalog";

describe("HAS calendar dates", () => {
  it.each([
    ["03/10/2018", "2018-10-03"],
    ["29/04/2015", "2015-04-29"],
    ["23/05/2012", "2012-05-23"],
    ["24/06/2020", "2020-06-24"],
    ["29/02/2024", "2024-02-29"],
    [" 12/02/2015 ", "2015-02-12"],
  ])("parses %s explicitly", (source, expected) => {
    expect(parseHasDate(source)?.toISOString()).toBe(`${expected}T00:00:00.000Z`);
  });

  it.each([null, "", "Invalid Date", "31/04/2023", "29/02/2023", "12/13/2016"])(
    "returns null for an absent or impossible date (%s)", (source) => {
      expect(parseHasDate(source)).toBeNull();
    },
  );

  it("keeps undated opinions last and preserves the source order of same-day opinions", () => {
    const history = [
      { opinionDate: null, id: "undated" },
      { opinionDate: "2015-04-29", id: "older" },
      { opinionDate: "2018-10-03", id: "first" },
      { opinionDate: "2018-10-03", id: "second" },
    ];
    expect(sortHasHistory(history).map((entry) => entry.id)).toEqual([
      "first", "second", "older", "undated",
    ]);
  });
});

describe("HAS history mappings", () => {
  it("preserves the complete SMR history entry and commission URL", () => {
    expect(mapSmr({
      date_avis_definitif: "2026-01-15",
      valeur_smr: "Important",
      motif_demande: "Inscription",
      libelle_smr: "Résumé complet de l'avis SMR",
      url: "https://www.has-sante.fr/jcms/example-smr",
    })).toEqual({
      opinionDate: "2026-01-15",
      value: "Important",
      evaluationReason: "Inscription",
      opinionSummary: "Résumé complet de l'avis SMR",
      hasUrl: "https://www.has-sante.fr/jcms/example-smr",
    });
  });

  it("preserves the complete ASMR history entry and commission URL", () => {
    expect(mapAsmr({
      date_avis_definitif: "2026-02-20",
      valeur_asmr: "III",
      motif_demande: "Extension d'indication",
      libelle_asmr: "Résumé complet de l'avis ASMR",
      url: "https://www.has-sante.fr/jcms/example-asmr",
    })).toEqual({
      opinionDate: "2026-02-20",
      value: "III",
      evaluationReason: "Extension d'indication",
      opinionSummary: "Résumé complet de l'avis ASMR",
      hasUrl: "https://www.has-sante.fr/jcms/example-asmr",
    });
  });
});
