"use server";

import { cache } from "react";
import { ResumeGeneric } from "../types";
import db from "..";
import { sql } from "kysely";
import { Specialite } from "@/types/SpecialiteTypes";
import type { AnsmSpecialiteGroupeGeneriqueRole } from "../types";
import { mapCatalogSpecialite, VISIBLE_SPECIALITE_AVAILABILITIES } from "./specialiteCatalog";

const PRINCEPS_ROLES: AnsmSpecialiteGroupeGeneriqueRole[] = [
  "REFERENCE",
  "COMPLEMENTARITE_POSOLOGIQUE",
];

const GENERIC_ROLES: AnsmSpecialiteGroupeGeneriqueRole[] = [
  "GENERIQUE",
  "GENERIQUE_AVEC_COMPLEMENTARITE_POSOLOGIQUE",
  "SUBSTITUTION",
];
const PUBLIC_MEMBER_ROLES: AnsmSpecialiteGroupeGeneriqueRole[] = [
  ...PRINCEPS_ROLES,
  ...GENERIC_ROLES,
];

export type GenericGroup = {
  codeGroupe: number;
  libelle: string;
  princeps: Specialite[];
  generiques: Specialite[];
};

export const getGenericsResumeWithLetter = cache(async function(letter: string): Promise<ResumeGeneric[]> {
  const result:ResumeGeneric[] = await db
    .selectFrom("resume_generiques")
    .selectAll()
    .where(({eb, ref}) => eb(
      sql<string>`upper(${ref("SpecName")})`, "like", `${letter.toUpperCase()}%`
    ))
    .distinct()
    .orderBy("SpecName")
    .execute();
  return result;
});

async function resolveGroupCode(identifier: string): Promise<number | undefined> {
  const membership = await db
    .selectFrom("ansm_specialite_groupe_generique")
    .where("cis", "=", identifier)
    .where("role", "in", PUBLIC_MEMBER_ROLES)
    .select("code_groupe")
    .orderBy("code_groupe")
    .executeTakeFirst();

  if (membership) return membership.code_groupe;

  const codeGroupe = Number(identifier);
  if (!Number.isInteger(codeGroupe)) return undefined;

  return (await db
    .selectFrom("ansm_groupe_generique")
    .where("code_groupe", "=", codeGroupe)
    .select("code_groupe")
    .executeTakeFirst())?.code_groupe;
}

export async function getGenericGroup(identifier: string): Promise<GenericGroup | undefined> {
  const codeGroupe = await resolveGroupCode(identifier);
  if (codeGroupe === undefined) return undefined;

  const [group, members] = await Promise.all([
    db
      .selectFrom("ansm_groupe_generique")
      .where("code_groupe", "=", codeGroupe)
      .select("libelle")
      .executeTakeFirst(),
    db
      .selectFrom("ansm_specialite_groupe_generique")
      .innerJoin("ansm_specialite", "ansm_specialite.cis", "ansm_specialite_groupe_generique.cis")
      .where("ansm_specialite_groupe_generique.code_groupe", "=", codeGroupe)
      .where("ansm_specialite.disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
      .selectAll("ansm_specialite")
      .select([
        "ansm_specialite_groupe_generique.role",
        "ansm_specialite_groupe_generique.rang",
      ])
      .orderBy("ansm_specialite_groupe_generique.rang", "asc")
      .orderBy("ansm_specialite.denomination", "asc")
      .execute(),
  ]);

  if (!group) return undefined;

  const princeps: Specialite[] = [];
  const generiques: Specialite[] = [];

  for (const member of members) {
    const specialite = mapCatalogSpecialite(member);
    if (member.role && PRINCEPS_ROLES.includes(member.role)) princeps.push(specialite);
    if (member.role && GENERIC_ROLES.includes(member.role)) generiques.push(specialite);
  }

  return {
    codeGroupe,
    libelle: group.libelle ?? "",
    princeps,
    generiques,
  };
}

export async function getGenericGroupMembership(CIS: string) {
  const membership = await db
    .selectFrom("ansm_specialite_groupe_generique")
    .where("cis", "=", CIS)
    .where("role", "in", PUBLIC_MEMBER_ROLES)
    .select("code_groupe")
    .orderBy("code_groupe")
    .executeTakeFirst();

  if (!membership) return undefined;

  const reference = await db
    .selectFrom("ansm_specialite_groupe_generique")
    .innerJoin("ansm_specialite", "ansm_specialite.cis", "ansm_specialite_groupe_generique.cis")
    .where("ansm_specialite_groupe_generique.code_groupe", "=", membership.code_groupe)
    .where("ansm_specialite_groupe_generique.role", "in", PRINCEPS_ROLES)
    .select([
      "ansm_specialite.cis",
      "ansm_specialite.denomination",
    ])
    .orderBy("ansm_specialite_groupe_generique.rang", "asc")
    .orderBy("ansm_specialite.cis", "asc")
    .executeTakeFirst();

  return {
    codeGroupe: membership.code_groupe,
    referenceCis: reference?.cis,
    referenceName: reference?.denomination,
  };
}

export async function getAllGenericGroupIds(): Promise<string[]> {
  const groups = await db
    .selectFrom("ansm_specialite_groupe_generique")
    .innerJoin(
      "ansm_specialite",
      "ansm_specialite.cis",
      "ansm_specialite_groupe_generique.cis",
    )
    .where("ansm_specialite_groupe_generique.role", "in", PUBLIC_MEMBER_ROLES)
    .where("ansm_specialite.disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .select("ansm_specialite_groupe_generique.code_groupe")
    .distinct()
    .orderBy("ansm_specialite_groupe_generique.code_groupe")
    .execute();

  return groups.map(({ code_groupe }) => code_groupe.toString());
}

export async function isPrincepsSpecialite(CIS: string): Promise<boolean> {
  return Boolean(await db
    .selectFrom("ansm_specialite_groupe_generique")
    .where("cis", "=", CIS)
    .where("role", "in", PRINCEPS_ROLES)
    .select("cis")
    .executeTakeFirst());
}

export async function getGeneriques(identifier: string): Promise<Specialite[]> {
  return (await getGenericGroup(identifier))?.generiques ?? [];
}
