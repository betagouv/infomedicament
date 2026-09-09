import { SubstanceNom } from "@/db/pdbmMySQL/types";

export function getSubstanceMainName(
  substances: SubstanceNom[],
): string {
  if(substances.length === 0) return "";
  const subsId = substances[0].SubsId;
  //The main name is the one where SubsId = NomId
  const subs = substances.find((subs) => subs.NomId === subsId);
  if(subs) return subs.NomLib.trim();
  else return substances[0].NomLib.trim();
}
