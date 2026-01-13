import { parse as csvParse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import path from "node:path";

export class ATCError extends Error {
  constructor(code: string) {
    super(`ATC code not found: ${code}`);
  }
}

export const atcData = csvParse(
  readFileSync(
    path.join(process.cwd(), "src", "data", "CIS-ATC_2024-04-07.csv"),
  ),
) as [CIS: string, ATC: string][];

export function getAtcCode(CIS: string) {
  const atc = atcData.find((row) => row[0] === CIS);

  if (!atc) {
    return atc;
    //throw new ATCError(CIS);
  }

  return atc[1];
}

//From ATC Code
export function getAtc1Code (atcCode:string): string {
  return atcCode.slice(0, 1);
}

//From ATC Code
export function getAtc2Code (atcCode:string): string {
  return atcCode.slice(0, 3);
}