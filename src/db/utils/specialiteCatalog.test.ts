import { describe, expect, it } from "vitest";
import type { AnsmSpecialite } from "@/db/types";
import {
  disponibiliteToDisplayStatus,
  disponibiliteToStatutBdm,
  mapCatalogSpecialite,
  mapCatalogSpecialiteWithEen,
  mapDetailedSpecialite,
  statutAmmToCompatibilityId,
  statutAmmToDisplayStatus,
} from "./specialiteCatalog";
import { SpecialiteStat } from "@/types/SpecialiteTypes";

const postgresRow: AnsmSpecialite = {
  cis: "60035714",
  code_ema: "EMEA/H/C/000992",
  denomination: "SIMPONI 50 mg",
  een: "PRESENTS",
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

  it("maps authorization status representations", () => {
    expect(statutAmmToDisplayStatus("ABROGEE")).toBe("Abrogée");
    expect(statutAmmToCompatibilityId("ABROGEE")).toBe(SpecialiteStat.Abrogée);
    expect(statutAmmToDisplayStatus("ARCHIVEE")).toBe("Archivée");
    expect(statutAmmToCompatibilityId("ARCHIVEE")).toBe(SpecialiteStat.Archivée);
  });

  it("does not expose the EEN status as an excipient label", () => {
    expect(mapCatalogSpecialite(postgresRow).Een).toBeNull();
  });

  it("maps separately loaded EEN labels", () => {
    expect(mapCatalogSpecialiteWithEen(postgresRow, "Latex").Een).toBe("Latex");
  });

  it("maps PostgreSQL rows without leaking their snake_case shape", () => {
    expect(mapDetailedSpecialite(
      postgresRow,
      "JANSSEN BIOLOGICS BV",
      123,
      { cis: "61234567", name: "PRINCEPS" },
      new Date("2021-10-22"),
      "Latex",
      "https://www.ema.europa.eu/example-epar.pdf",
    ))
      .toEqual({
        SpecId: "60035714",
        SpecDenom01: "SIMPONI 50 mg",
        ProcId: "CENTRALISEE",
        StatutBdm: 3,
        Een: "Latex",
        StatId: SpecialiteStat.Abrogée,
        SpecDateAMM: new Date("2009-10-01"),
        SpecStatDate: new Date("2021-10-22"),
        statutAutorisation: "Abrogée",
        statutComm: "Non communiquée",
        titulairesList: "JANSSEN BIOLOGICS BV",
        genericGroupCode: 123,
        referenceSpecialite: { cis: "61234567", name: "PRINCEPS" },
        urlCentralise: "https://www.ema.europa.eu/example-epar.pdf",
      });
  });
});
