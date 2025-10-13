"use server";

import "server-cli-only";
import { unstable_cache } from "next/cache";
import { pdbmMySQL } from "@/db/pdbmMySQL";

// Get the specialites list from code patho
export const getPathoSpecialites = unstable_cache(async function (code: string) {
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .leftJoin("Spec_Patho", "Specialite.SpecId", "Spec_Patho.SpecId")
    .where("Spec_Patho.codePatho", "=", code)
    .execute();
});

//Get the code patho list from specialite code CIS
export const getSpecialitesPatho = unstable_cache(async function (CIS: string) {
  const rawCodePatho = await pdbmMySQL
    .selectFrom("Spec_Patho")
    .select("Spec_Patho.codePatho")
    .leftJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .where("Specialite.SpecId", "=", CIS)
    .execute();
  return rawCodePatho.map((code) => code.codePatho);
});

export async function getAllPathoWithSpecialites() {
  "use cache";
  return pdbmMySQL
    .selectFrom("Patho")
    .innerJoin("Spec_Patho", "Patho.codePatho", "Spec_Patho.codePatho")
    .innerJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .selectAll("Patho")
    .select("Specialite.SpecDenom01")
    .execute();
};
