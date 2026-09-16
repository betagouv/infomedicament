import { describe, expect, it } from "vitest";
import { mapAsmr, mapSmr } from "./hasCatalog";

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
