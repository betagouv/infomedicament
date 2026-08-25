import { describe, expect, it } from "vitest";
import type { AnsmSpecialite } from "@/db/types";
import {
  disponibiliteToDisplayStatus,
  disponibiliteToStatutBdm,
  mapDetailedSpecialite,
  procedureToCompatibilityCode,
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
    expect(procedureToCompatibilityCode("CENTRALISEE")).toBe("CENTRALISEE");
    expect(procedureToCompatibilityCode(null)).toBe("");
    expect(statutAmmToDisplayStatus("ARCHIVEE")).toBe("Archivée");
    expect(statutAmmToCompatibilityId("ARCHIVEE")).toBe(SpecialiteStat.Archivée);
  });

  it("maps PostgreSQL rows without leaking their snake_case shape", () => {
    expect(mapDetailedSpecialite(postgresRow, "JANSSEN BIOLOGICS BV", "PRINCEPS"))
      .toEqual({
        SpecId: "60035714",
        SpecDenom01: "SIMPONI 50 mg",
        SpecGeneId: "61234567",
        ProcId: "CENTRALISEE",
        StatutBdm: 3,
        Een: null,
        StatId: SpecialiteStat.Abrogée,
        SpecDateAMM: new Date("2009-10-01"),
        SpecStatDate: new Date("2026-06-01"),
        statutAutorisation: "Abrogée",
        statutComm: "Non communiquée",
        titulairesList: "JANSSEN BIOLOGICS BV",
        generiqueName: "PRINCEPS",
        urlCentralise: null,
      });
  });
});
