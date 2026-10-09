"use server";

import "server-cli-only";
import db from "..";
import { LetterType } from "../types";

export async function getLetters(type: LetterType): Promise<string[]> {
  "use cache: remote";

  const result = await db.
    selectFrom("letters")
    .selectAll()
    .where("type", "=", type)
    .executeTakeFirst();
  if(result){
    return result.letters.sort((a,b) => a.localeCompare(b));
  }
  return [];
}
