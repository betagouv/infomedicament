
import db from "@/db";

export class ATCError extends Error {
  constructor(code: string) {
    super(`ATC code not found: ${code}`);
  }
}

export async function getAtcCode(CIS: string): Promise<string | undefined> {
  "use cache: remote";

  // A specialty can have several ATC mappings. Keep the same stable primary
  // code as the summary builder and pediatric RCP reader in dataeng.
  const result = await db
    .selectFrom("ansm_specialite_atc")
    .innerJoin("ansm_atc", "ansm_atc.code", "ansm_specialite_atc.code_atc")
    .select("ansm_atc.libelle_abr as code")
    .where("ansm_specialite_atc.cis", "=", CIS)
    .where("ansm_atc.libelle_abr", "is not", null)
    .where("ansm_atc.libelle_abr", "!=", "")
    .orderBy("ansm_atc.libelle_abr", "asc")
    .orderBy("ansm_atc.code", "asc")
    .executeTakeFirst();

  return result?.code ?? undefined;
}

//From ATC Code
export function getAtc1Code (atcCode:string): string {
  return atcCode.slice(0, 1);
}

//From ATC Code
export function getAtc2Code (atcCode:string): string {
  return atcCode.slice(0, 3);
}
