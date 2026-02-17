import { Specialite, VUEvnts } from "@/db/pdbmMySQL/types";
import { ResumeSpecGroupDB } from "@/db/types";
import { MedicamentGroup } from "@/displayUtils";
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

export function isCentralisee(
  specialite: DetailedSpecialite | Specialite
): boolean {
  if(specialite.ProcId && specialite.ProcId === "20") return true;
  if(specialite.ProcId && specialite.ProcId === "100") return true;
  return false;
};

export function isCommercialisee(
  specialite: DetailedSpecialite | Specialite | ResumeSpecialite
): boolean {
  if(specialite.StatutBdm.toString() === "2") return false;
  return true;
};

export function isAIP(
  specialite: DetailedSpecialite | Specialite | ResumeSpecialite
): boolean {
  if(specialite.ProcId && specialite.ProcId === "50") return true;
  return false;
};

export function isAlerteSecurite(
  specialite: DetailedSpecialite | Specialite | ResumeSpecialite
): boolean {
  if(specialite.StatutBdm.toString() === "3") return true;
  return false;
}

export function isSurveillanceRenforcee(
  events: VUEvnts[]
): boolean {
  const today = new Date();
  let isSurveillanceRenforcee = false;
  events.forEach((event: VUEvnts) => {
    if(event.codeEvnt === '83' && today > event.dateEvnt && today < event.dateEcheance){
      isSurveillanceRenforcee = true;
    }
  });
  return isSurveillanceRenforcee;
}

export function isHomeopathie(
  specialite: DetailedSpecialite | Specialite | ResumeSpecialite
): boolean {
  if(specialite.ProcId && specialite.ProcId === "60") return true;
  return false;
};

//Format la liste des spécialités issus de la table résumé
export function formatSpecialitesResume(specialites: string[][]): ResumeSpecialite[] {
  const formatSpecs: ResumeSpecialite[] = specialites.map((spec) => {
    const result = {
      SpecId: spec[0],
      SpecDenom01: spec[1],
      StatutBdm: spec[2],
      ProcId: spec[3],
      isSurveillanceRenforcee: spec[4] === "true" ? true : false,
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

export function getProcedureLibLong(codeProcedure: number): string{
  if (codeProcedure === 10 || codeProcedure === 100)
    return "Procédure nationale";
  if (codeProcedure === 20)
    return "Procédure centralisée";
  if (codeProcedure === 30)
    return "Procédure de reconnaissance mutuelle";
  if (codeProcedure === 40)
    return "Procédure décentralisée";
  if (codeProcedure === 50)
    return "Autorisation d'Importation Parallèle";
  if (codeProcedure === 60)
    return "Enregistrement homéopathique en procédure nationale";
  if (codeProcedure === 70)
    return "Enregistrement phytothérapie en procédure nationale";
  if (codeProcedure === 80)
    return "Enregistrement phytothérapie en procédure décentralisée";
  if (codeProcedure === 90)
    return "Autorisation d'Importation";

  return "Procédure non communiquée";
}

export function getTypeInfoTxt(codeTypeInfo: number): string{
  if (codeTypeInfo === 1)
    return "Lettre aux professionnels";
  if (codeTypeInfo === 2)
    return "Point d'information";
  if (codeTypeInfo === 3)
    return "Communiqué de presse";
  if (codeTypeInfo === 4)
    return "Rubrique Internet";
  if (codeTypeInfo === 5)
    return "Retrait lot";
  if (codeTypeInfo === 6)
    return "Vidéo";
  if (codeTypeInfo === 7)
    return "MARR";
  if (codeTypeInfo === 8)
    return "Dossiers thématiques";

  return "Non catégorisée";
}
