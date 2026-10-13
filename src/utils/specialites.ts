import type { SafetyEvent } from "@/types/FicheInfoTypes";
import { REINFORCED_SURVEILLANCE_EVENT_CODE } from "@/db/utils/safetyCatalog";
import { ResumeSpecGroupDB, ResumeSpecialiteDB } from "@/db/types";
import { MedicamentGroup } from "@/displayUtils";
import { ShortIndication } from "@/types/IndicationsTypes";
import {
  DelivranceCondition,
  DetailedSpecialite,
  ResumeSpecGroup,
  ResumeSpecialite,
  ShortSpecialite,
  Specialite,
  SpecialiteProcedure,
} from "@/types/SpecialiteTypes";
import slugify from "slugify";

export function getSpecialiteGroupName(
  specialite: Specialite | string,
): string {
  const specName =
    typeof specialite === "string" ? specialite : specialite.SpecDenom01;
  const regexMatch = specName.match(/^[^0-9,]+/);
  return (regexMatch ? regexMatch[0] : specName).trim();
}

export function groupSpecialites<T extends Specialite>(
  specialites: T[],
  isSort?: boolean,
): MedicamentGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const specialite of specialites) {
    const groupName = getSpecialiteGroupName(specialite);
    if (groups.has(groupName)) {
      groups.get(groupName)?.push(specialite);
    } else {
      groups.set(groupName, [specialite]);
    }
  }
  let allGroups = Array.from(groups.entries());
  if (isSort) {
    allGroups = allGroups.sort((a, b) => a[0].localeCompare(b[0]));
  }
  return allGroups;
}

export function isCentralisee(
  specialite: DetailedSpecialite | Specialite,
): boolean {
  return specialite.ProcId === "CENTRALISEE";
}

export function isCommercialisee(
  specialite:
    | DetailedSpecialite
    | Specialite
    | ShortSpecialite
    | ResumeSpecialite,
): boolean {
  if (specialite.StatutBdm.toString() === "2") return false;
  return true;
}

export function isAIP(
  specialite:
    | DetailedSpecialite
    | Specialite
    | ShortSpecialite
    | ResumeSpecialite,
): boolean {
  // Summary rows keep legacy codes until they are rebuilt by a later migration step.
  return (
    specialite.ProcId === "IMPORTATION_PARALLELE" || specialite.ProcId === "50"
  );
}

export function isAlerteSecurite(
  specialite:
    | DetailedSpecialite
    | Specialite
    | ShortSpecialite
    | ResumeSpecialite,
): boolean {
  if (specialite.StatutBdm.toString() === "3") return true;
  return false;
}

export function isSurveillanceRenforcee(
  events: SafetyEvent[],
  now = new Date(),
): boolean {
  return events.some(
    (event) =>
      event.code === REINFORCED_SURVEILLANCE_EVENT_CODE &&
      event.eventDate !== null &&
      event.expiryDate !== null &&
      now > event.eventDate &&
      now < event.expiryDate,
  );
}

export function isHomeopathie(
  specialite: DetailedSpecialite | Specialite,
): boolean {
  return specialite.ProcId === "HOMEOPATHIQUE_NATIONALE";
}

//Format indications details from resume table
export function formatIndicationsDetails(
  indicationsIdsNames: string[][],
): ShortIndication[] {
  const formatIndications: ShortIndication[] = indicationsIdsNames.map(
    (indication) => {
      return {
        idIndication: Number(indication[0].trim()),
        nomIndication: indication[1],
      };
    },
  );
  return formatIndications;
}

//Format la liste des spécialités issus de la table résumé
export function formatShortSpecialites(
  specialites: string[][],
): ShortSpecialite[] {
  const formatSpecs: ShortSpecialite[] = specialites.map((spec) => {
    const result = {
      SpecId: spec[0],
      SpecDenom01: spec[1],
      StatutBdm: spec[2],
      ProcId: spec[3],
      isSurveillanceRenforcee: spec[4] === "true" ? true : false,
    };
    return result;
  });
  return formatSpecs;
}

//Format la liste des spécialités issus de la table résumé
export function formatSpecialitesResumeFromGroups(
  specsGroups: ResumeSpecGroupDB[],
): ResumeSpecGroup[] {
  return specsGroups.map((group) => {
    return {
      ...group,
      shortSpecialites: formatShortSpecialites(group.specialites),
      indicationsDetails: formatIndicationsDetails(group.indicationsIdsNames),
    };
  });
}

//Format la liste des spécialités issus de la table résumé
export function formatSpecialitesResume(
  specialites: ResumeSpecialiteDB[],
): ResumeSpecialite[] {
  return specialites.map((spec) => {
    return {
      ...spec,
      indicationsDetails: formatIndicationsDetails(spec.indicationsIdsNames),
    };
  });
}

export function getProcedureLibLong(procedure: SpecialiteProcedure): string {
  switch (procedure) {
    case "NATIONALE":
      return "Procédure nationale";
    case "CENTRALISEE":
      return "Procédure centralisée";
    case "RECONNAISSANCE_MUTUELLE":
      return "Procédure de reconnaissance mutuelle";
    case "DECENTRALISEE":
      return "Procédure décentralisée";
    case "IMPORTATION_PARALLELE":
      return "Autorisation d'Importation Parallèle";
    case "HOMEOPATHIQUE_NATIONALE":
      return "Enregistrement homéopathique en procédure nationale";
    case "PHYTOTHERAPIE_NATIONALE":
      return "Enregistrement phytothérapie en procédure nationale";
    case "PHYTOTHERAPIE_DECENTRALISEE":
      return "Enregistrement phytothérapie en procédure décentralisée";
    case "IMPORTATION":
      return "Autorisation d'Importation";
    case "NON_COMMUNIQUEE":
      return "Procédure non communiquée";
  }
}

export function isHospitalDelivrance(
  delivrances: DelivranceCondition[],
): boolean {
  return delivrances.some((delivrance) => delivrance.code === 3);
}

/**
 * Builds the speciality page slug: slugified name followed by the CIS code,
 * e.g. "doliprane-1000-mg-comprime-60234100".
 * The CIS suffix keeps slugs unique and stable when a name changes.
 */
export function getSpecSlug(cis: string, name: string): string {
  // Keep as word separators:
  // - "/" between dosages and substances (e.g. "500 mg/25 mg")
  // - parentheses, sometimes not preceded by a space (e.g. "injectable(vaccin")
  // - the decimal comma (e.g. "11,25 mg" -> "11-25-mg", not "1125-mg")
  // - the period, except in uppercase abbreviations like "L.P." or "U.I."
  //   (e.g. "0.5 mg", "XBB.1.5", "injectable.Vaccin")
  const separatedName = name
    .replace(/[/()]/g, "-")
    .replace(/(\d),(\d)/g, "$1-$2")
    .replace(/(?<![A-ZÀ-Ý])\.|\.(?![A-ZÀ-Ý\s/]|$)/g, "-");
  const nameSlug = slugify(separatedName, { lower: true, strict: true, locale: "fr" });
  const trimmedCis = cis.trim();
  return nameSlug ? `${nameSlug}-${trimmedCis}` : trimmedCis;
}

export function getCISFromSlug(slug: string): string {
  return decodeURIComponent(slug).split("-").pop()?.trim() ?? "";
}