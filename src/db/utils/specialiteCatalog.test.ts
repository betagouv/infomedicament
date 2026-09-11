import { describe, expect, it } from "vitest";
import type { AnsmSpecialite } from "@/db/types";
import {
  disponibiliteToDisplayStatus,
  disponibiliteToStatutBdm,
  legacyProcedureToSpecialiteProcedure,
  mapDetailedSpecialite,
  statutAmmToCompatibilityId,
  statutAmmToDisplayStatus,
} from "./specialiteCatalog";
import { SpecialiteStat } from "@/types/SpecialiteTypes";

const postgresRow: AnsmSpecialite = {
  cis: "60035714",
  denomination: "SIMPONI 50 mg",
  generique: 61234567,
  procedure: "CENTRALISEE",
  date_amm: new Date("2009-10-01"),
  statut_amm: "ABROGEE",
  date_modification: new Date("2026-06-01"),
  disponibilite: "ALERTE",
};

describe("specialite catalog mappings", () => {
  it("centralizes ANSM status compatibility", () => {
    expect(disponibiliteToStatutBdm("DISPONIBLE")).toBe(1);
    expect(disponibiliteToStatutBdm("PARTIELLE")).toBe(2);
    expect(disponibiliteToStatutBdm("ALERTE")).toBe(3);
    expect(disponibiliteToStatutBdm("INDISPONIBLE")).toBe(2);
    expect(disponibiliteToDisplayStatus("DISPONIBLE")).toBe("Commercialisée");
    expect(disponibiliteToDisplayStatus("PARTIELLE")).toBe("Non communiquée");
  });

  it("maps authorization status and procedure representations", () => {
    expect(statutAmmToDisplayStatus("ABROGEE")).toBe("Abrogée");
    expect(statutAmmToCompatibilityId("ABROGEE")).toBe(SpecialiteStat.Abrogée);
    expect(legacyProcedureToSpecialiteProcedure("20")).toBe("CENTRALISEE");
    expect(legacyProcedureToSpecialiteProcedure("50")).toBe("IMPORTATION_PARALLELE");
    expect(legacyProcedureToSpecialiteProcedure("60")).toBe("HOMEOPATHIQUE_NATIONALE");
    expect(legacyProcedureToSpecialiteProcedure("")).toBe("NON_COMMUNIQUEE");
    expect(statutAmmToDisplayStatus("ARCHIVEE")).toBe("Archivée");
    expect(statutAmmToCompatibilityId("ARCHIVEE")).toBe(SpecialiteStat.Archivée);
  });

  it("maps PostgreSQL rows without leaking their snake_case shape", () => {
    expect(mapDetailedSpecialite(
      postgresRow,
      "JANSSEN BIOLOGICS BV",
      "PRINCEPS",
      "61234567",
      new Date("2021-10-22"),
      "Latex",
    ))
      .toEqual({
        SpecId: "60035714",
        SpecDenom01: "SIMPONI 50 mg",
        SpecGeneId: "61234567",
        ProcId: "CENTRALISEE",
        StatutBdm: 3,
        Een: "Latex",
        StatId: SpecialiteStat.Abrogée,
        SpecDateAMM: new Date("2009-10-01"),
        SpecStatDate: new Date("2021-10-22"),
        statutAutorisation: "Abrogée",
        statutComm: "Non communiquée",
        titulairesList: "JANSSEN BIOLOGICS BV",
        generiqueName: "PRINCEPS",
        urlCentralise: null,
      });
  });
});
