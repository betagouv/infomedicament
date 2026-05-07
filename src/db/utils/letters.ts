"use server";

import "server-cli-only";
import { unstable_cache } from "next/cache";
import db from "..";
import { LetterType } from "../types";

export const getLetters = unstable_cache(async function(type: LetterType): Promise<string[]> {
  const result = await db.
    selectFrom("letters")
    .selectAll()
    .where("type", "=", type)
    .executeTakeFirst();
  if(result){
    return result.letters.sort((a,b) => a.localeCompare(b));
  }
  return [];
}, ["letters"], { revalidate: 86400 });