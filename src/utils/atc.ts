import db from "@/db";

export class ATCError extends Error {
  constructor(code: string) {
    super(`ATC code not found: ${code}`);
  }
}

export async function getAtcCode(CIS: string): Promise<string | undefined> {
  const result = await db
    .selectFrom("cis_atc")
    .innerJoin("atc", "atc.code_terme", "cis_atc.code_terme_atc")
    .select("atc.code")
    .where("cis_atc.code_cis", "=", CIS)
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
