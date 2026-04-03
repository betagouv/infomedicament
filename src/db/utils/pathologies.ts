"use server";
import "server-cli-only";

import { unstable_cache } from "next/cache";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { cache } from "react";
import db from "..";
import { ResumePatho } from "../types";
import { sql } from "kysely";
import { ClasseCliniqueSpec, ShortPatho } from "@/types/PathoTypes";

export async function getPatho(code: string): Promise<ShortPatho | undefined> {
  const bdpmPatho = await pdbmMySQL
    .selectFrom("Patho")
    .where("codePatho", "=", code)
    .select(["codePatho", "NomPatho"])
    .executeTakeFirst();
  if(!bdpmPatho) {
    //Classe clinique
    const classeClinique = await db
      .selectFrom("classes_cliniques")
      .where("codeTerme", "=", Number(code.trim()))
      .select(["codeTerme", "libCourt"])
      .executeTakeFirst();
      if(classeClinique) {
        return {
          codePatho: classeClinique.codeTerme.toString(),
          NomPatho: classeClinique.libCourt,
        }
      }
    return classeClinique;
  }
  return bdpmPatho;
}

//Get the code patho list from specialite code CIS
export const getSpecialitePatho = unstable_cache(
  async function (CIS: string): Promise<string[]> {
    const codes: string[] = []
    const rawCodePatho = await pdbmMySQL
      .selectFrom("Spec_Patho")
      .select("Spec_Patho.codePatho")
      .leftJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
      .where("Specialite.SpecId", "=", CIS)
      .distinct()
      .execute();
    rawCodePatho.forEach((code) => codes.push(code.codePatho));
    const rawClassesCliniques = await db
      .selectFrom("vu_classes_cliniques")
      .where("vu_classes_cliniques.codeVU", "=", CIS)
      .select("vu_classes_cliniques.codeClasClinique")
      .distinct()
      .execute();
    rawClassesCliniques.forEach((code) => codes.push(code.codeClasClinique.toString()));
    return codes;
  },
  ["specialite-patho"],
  { revalidate: 3600 } // cache for 1 hour
);
export const getSpecialitesPatho = cache(async function (CIS: string[]): Promise<ShortPatho[]> {
  const pathos: ShortPatho[] = await pdbmMySQL
    .selectFrom("Spec_Patho")
    .innerJoin("Patho", "Spec_Patho.codePatho", "Patho.codePatho")
    .where("Spec_Patho.SpecId", "in", CIS)
    .select("Spec_Patho.codePatho").distinct()
    .select("Patho.NomPatho")
    .execute();
  const classesCliniques = await db
    .selectFrom("vu_classes_cliniques")
    .innerJoin("classes_cliniques", "vu_classes_cliniques.codeClasClinique", "classes_cliniques.codeTerme")
    .where("vu_classes_cliniques.codeVU", "in", CIS)
    .select("vu_classes_cliniques.codeClasClinique").distinct()
    .select("classes_cliniques.libCourt")
    .execute();
  if(classesCliniques) {
    classesCliniques.forEach((shortClasseClinique) => {
      pathos.push({
        codePatho: shortClasseClinique.codeClasClinique.toString(),
        NomPatho: shortClasseClinique.libCourt,
      })
    })
  }
  return pathos;
});

export const getAllPathoWithSpecialites = cache(async function () {
  //Only Patho from BDPM
  return await pdbmMySQL
    .selectFrom("Patho")
    .innerJoin("Spec_Patho", "Patho.codePatho", "Spec_Patho.codePatho")
    .innerJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .where("Specialite.IsBdm", "=", 1)
    .selectAll("Patho")
    .select("Specialite.SpecDenom01")
    .orderBy("Specialite.SpecDenom01")
    .execute();
});

export const getAllClasseCliniqueWithSpecialites = cache(async function (): Promise<ClasseCliniqueSpec[]> {
  //Only Classes Cliniques
  const rawClassesCliniques = await db
    .selectFrom("vu_classes_cliniques")
    .innerJoin("classes_cliniques", "vu_classes_cliniques.codeClasClinique", "classes_cliniques.codeTerme")
    .innerJoin("ref_pathologies", "vu_classes_cliniques.codeClasClinique", "ref_pathologies.code_patho")
    .where("ref_pathologies.isClasseClinique", "=", true)
    .select(["vu_classes_cliniques.codeVU", "vu_classes_cliniques.codeClasClinique"])
    .select("classes_cliniques.libCourt")
    .execute();
  const specialites = await pdbmMySQL
    .selectFrom("Specialite")
    .where("IsBdm", "=", 1)
    .where("SpecId", "in", rawClassesCliniques.map((classe) => classe.codeVU.trim()))
    .select(["SpecId", "SpecDenom01"])
    .execute();
  const classesCliniquesWithSpec: ClasseCliniqueSpec[] = [];
  rawClassesCliniques.forEach((classe) => {
    const spec = specialites.find((spec) => spec.SpecId.trim() === classe.codeVU.trim());
    if(spec) {
      classesCliniquesWithSpec.push({
        codeClasClinique: classe.codeClasClinique,
        libCourt: classe.libCourt,
        SpecId: spec.SpecId,
        SpecDenom01: spec.SpecDenom01,
      });
    }
  });
  return classesCliniquesWithSpec;
});

export const getPathologiesResumeWithLetter = cache(async function (letter: string): Promise<ResumePatho[]> {
  const result: ResumePatho[] = await db
    .selectFrom("resume_pathologies")
    .selectAll()
    .where(({ eb, ref }) => eb(
      sql<string>`upper(${ref("NomPatho")})`, "like", `${letter.toUpperCase()}%`
    ))
    .orderBy("NomPatho")
    .execute();
  return result;
});

export const getPathologiesResume = cache(async function (pathoCodes: string[]): Promise<ResumePatho[]> {
  if (pathoCodes.length === 0) return [];
  const result: ResumePatho[] = await db
    .selectFrom("resume_pathologies")
    .selectAll()
    .where("codePatho", "in", pathoCodes)
    .orderBy("codePatho")
    .execute();
  return result;
});

export async function getPathologyDefinition(
  code: string,
): Promise<string> {
  const rows = await db
    .selectFrom("ref_pathologies")
    .select("definition")
    .where("code_patho", "=", Number(code.trim()))
    .execute();

  if (rows.length === 0) {
    throw new Error(`Pathology code not found: ${code}`);
  }

  return rows[0].definition as string;

}