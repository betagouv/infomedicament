import type { AnsmSpecialite } from "@/db/types";
import {
  DetailedSpecialite,
  Specialite,
  SpecialiteStat,
} from "@/types/SpecialiteTypes";

export const VISIBLE_SPECIALITE_AVAILABILITIES: Exclude<
  AnsmSpecialite["disponibilite"],
  "INDISPONIBLE" | null
>[] = ["DISPONIBLE", "PARTIELLE", "ALERTE"];

export function statutAmmToDisplayStatus(
  statut: AnsmSpecialite["statut_amm"],
): string | null {
  switch (statut) {
    case "ACTIVE": return "Valide";
    case "ABROGEE": return "Abrogée";
    case "SUSPENDUE": return "Suspendue";
    case "RETIREE": return "Retirée";
    case "INACTIVE":
    case "ARCHIVEE": return "Archivée";
    default: return null;
  }
}

export function statutAmmToCompatibilityId(
  statut: AnsmSpecialite["statut_amm"],
): SpecialiteStat | null {
  switch (statut) {
    case "ACTIVE": return SpecialiteStat.Valide;
    case "ABROGEE": return SpecialiteStat.Abrogée;
    case "SUSPENDUE": return SpecialiteStat.Suspendue;
    case "RETIREE": return SpecialiteStat.Retirée;
    case "INACTIVE":
    case "ARCHIVEE": return SpecialiteStat.Archivée;
    default: return null;
  }
}

export function disponibiliteToDisplayStatus(
  disponibilite: AnsmSpecialite["disponibilite"],
): string | null {
  return disponibilite === "DISPONIBLE" ? "Commercialisée" : "Non communiquée";
}

// Compatibility for existing display helpers during the incremental migration.
export function disponibiliteToStatutBdm(
  disponibilite: AnsmSpecialite["disponibilite"],
): number {
  if (disponibilite === "ALERTE") return 3;
  // PARTIELLE medicines remain addressable but must display the public
  // unavailable/soon-unavailable warning. INDISPONIBLE rows are not routed.
  if (disponibilite === "PARTIELLE" || disponibilite === "INDISPONIBLE") return 2;
  return 1;
}

export function mapCatalogSpecialite(row: AnsmSpecialite): Specialite {
  return {
    SpecId: row.cis,
    SpecDenom01: row.denomination ?? "",
    ProcId: row.procedure ?? "NON_COMMUNIQUEE",
    StatutBdm: disponibiliteToStatutBdm(row.disponibilite),
    Een: null,
  };
}

export function mapCatalogSpecialiteWithEen(
  row: AnsmSpecialite,
  een: string | null,
): Specialite {
  return {
    ...mapCatalogSpecialite(row),
    Een: een,
  };
}

export function mapDetailedSpecialite(
  row: AnsmSpecialite,
  titulairesList: string | null,
  genericGroupCode: number | null,
  referenceSpecialite: DetailedSpecialite["referenceSpecialite"],
  statusDate: Date | null,
  een: string | null,
  centralisedUrl: string | null,
): DetailedSpecialite {
  return {
    ...mapCatalogSpecialiteWithEen(row, een),
    StatId: statutAmmToCompatibilityId(row.statut_amm),
    SpecDateAMM: row.date_amm,
    SpecStatDate: statusDate,
    statutAutorisation: statutAmmToDisplayStatus(row.statut_amm),
    statutComm: disponibiliteToDisplayStatus(row.disponibilite),
    titulairesList,
    genericGroupCode,
    referenceSpecialite,
    urlCentralise: centralisedUrl,
  };
}
