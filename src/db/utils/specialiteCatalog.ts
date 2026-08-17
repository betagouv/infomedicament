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
  if (disponibilite === "INDISPONIBLE") return 2;
  return 1;
}

export function procedureToCompatibilityCode(procedure: AnsmSpecialite["procedure"]): string {
  return procedure ?? "";
}

export function mapCatalogSpecialite(row: AnsmSpecialite): Specialite {
  return {
    SpecId: row.cis,
    SpecDenom01: row.denomination ?? "",
    SpecGeneId: row.generique?.toString() ?? "",
    ProcId: procedureToCompatibilityCode(row.procedure),
    StatutBdm: disponibiliteToStatutBdm(row.disponibilite),
    // The ANSM PostgreSQL catalog has no equivalent excipient field in this batch.
    Een: null,
  };
}

export function mapDetailedSpecialite(
  row: AnsmSpecialite,
  titulairesList: string | null,
  generiqueName: string | null,
): DetailedSpecialite {
  return {
    ...mapCatalogSpecialite(row),
    StatId: statutAmmToCompatibilityId(row.statut_amm),
    SpecDateAMM: row.date_amm,
    SpecStatDate: row.date_modification,
    statutAutorisation: statutAmmToDisplayStatus(row.statut_amm),
    statutComm: disponibiliteToDisplayStatus(row.disponibilite),
    titulairesList,
    generiqueName,
    // No equivalent of the MySQL VUEmaEpar URL exists in the ANSM tables.
    // Preserve the absence explicitly so callers never mistake it for migrated data.
    urlCentralise: null,
  };
}
