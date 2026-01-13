"use server";

import "server-cli-only";
import { cache } from "react";
import db from "..";
import { LetterType } from "../types";

export const getLetters = cache(async function(type: LetterType): Promise<string[]> {
  const result = await db.
    selectFrom("letters")
    .selectAll()
    .where("type", "=", type)
    .executeTakeFirst();
  if(result){
    return result.letters.sort((a,b) => a.localeCompare(b));
  }
  return [];
});