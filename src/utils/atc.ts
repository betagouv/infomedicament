import db from "@/db";

export class ATCError extends Error {
  constructor(code: string) {
    super(`ATC code not found: ${code}`);
  }
}

export async function getAtcCode(CIS: string): Promise<string | undefined> {
  const result = await db
    .selectFrom("cis_atc")
    .select("code_atc")
    .where("code_cis", "=", CIS)
    .executeTakeFirst();

  return result?.code_atc ?? undefined;
}

//From ATC Code
export function getAtc1Code(atcCode: string): string {
  return atcCode.slice(0, 1);
}

//From ATC Code
export function getAtc2Code(atcCode: string): string {
  return atcCode.slice(0, 3);
}
