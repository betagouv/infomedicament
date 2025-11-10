import { Specialite, PresentationStat, PresentationComm } from "@/db/pdbmMySQL/types";
import { ResumeSpecGroupDB } from "@/db/types";
import { MedicamentGroup } from "@/displayUtils";
import { Presentation } from "@/types/PresentationTypes";
import { DetailedSpecialite, ResumeSpecGroup, ResumeSpecialite } from "@/types/SpecialiteTypes";

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
  if(isSort){
    allGroups = allGroups.sort((a,b) => a[0].localeCompare(b[0]))
  }
  return allGroups;
}

export function isCentralisee(specialite: DetailedSpecialite | Specialite){
  if(specialite.ProcId && specialite.ProcId === "20") return true;
  if(specialite.ProcId && specialite.ProcId === "100") return true;
  return false;
};

export function isCommercialisee(presentations: Presentation[]){
  if(presentations.length === 0) return false;
  let isComm: boolean = false;
  presentations.forEach((pres) => {
    if(pres 
      && pres.CommId.toString() === PresentationComm.Commercialisation.toString()
      && (!pres.StatId || pres.StatId.toString() !== PresentationStat.Abrogation.toString())
    ) {
      isComm = true;
    }
  });
  return isComm;
};

//Format la liste des spécialités issus de la table résumé
export function formatSpecialitesResume(specialites: string[][]): ResumeSpecialite[] {
  const formatSpecs: ResumeSpecialite[] = specialites.map((spec) => {
    const result = {
      SpecId: spec[0],
      SpecDenom01: spec[1],
      isCommercialisee: spec[2] === "true" ? true : false,
      isCentralisee: spec[3] === "true" ? true : false,
    }
    return result;
  });
  return formatSpecs;
}

//Format la liste des spécialités issus de la table résumé
export function formatSpecialitesResumeFromGroups(specsGroups: ResumeSpecGroupDB[]): ResumeSpecGroup[] {
  return specsGroups.map((group) => {
    return {
      ...group,
      resumeSpecialites: formatSpecialitesResume(group.specialites)
    }
  });
}