import "server-cli-only";

import { unstable_cache } from "next/cache";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";

export const getPathoSpecialites = unstable_cache(async function (code: string) {
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .leftJoin("Spec_Patho", "Specialite.SpecId", "Spec_Patho.SpecId")
    .where("Spec_Patho.codePatho", "=", code)
    .where("Specialite.SpecId", "in", liste_CIS_MVP)
    .execute();
});