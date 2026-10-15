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

type AuthorizationSourceStatus = NonNullable<AnsmSpecialite["statut_amm"]>;

const authorizationStatusMap: Record<AuthorizationSourceStatus, SpecialiteStat> = {
  ACTIVE: SpecialiteStat.Valide,
  ABROGEE: SpecialiteStat.Abrogée,
  SUSPENDUE: SpecialiteStat.Suspendue,
  RETIREE: SpecialiteStat.Retirée,
  INACTIVE: SpecialiteStat.Archivée,
  ARCHIVEE: SpecialiteStat.Archivée,
};

export function statutAmmToDisplayStatus(
  statut: AnsmSpecialite["statut_amm"],
): string | null {
  const id = statutAmmToCompatibilityId(statut);
  return id === null ? null : SpecialiteStat[id];
}

export function getAuthorizationSourceStatuses(label: string): AuthorizationSourceStatus[] {
  return (Object.keys(authorizationStatusMap) as AuthorizationSourceStatus[])
    .filter((status) => statutAmmToDisplayStatus(status) === label);
}

export function statutAmmToCompatibilityId(
  statut: AnsmSpecialite["statut_amm"],
): SpecialiteStat | null {
  return statut === null ? null : authorizationStatusMap[statut] ?? null;
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
  // Keep the legacy summary code; availability preserves the distinction
  // between PARTIELLE and INDISPONIBLE for catalogue-backed displays.
  if (disponibilite === "PARTIELLE" || disponibilite === "INDISPONIBLE") return 2;
  return 1;
}

export function mapCatalogSpecialite(row: AnsmSpecialite): Specialite {
  return {
    availability: row.disponibilite,
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
  };
}
