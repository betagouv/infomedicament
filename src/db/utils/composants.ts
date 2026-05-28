"use server";
import "server-cli-only";

import { cache } from "react";
import { BdpmComposant } from "@/db/types";
import db from "@/db";

export const getComposants = cache(async function (CIS: string) {
  return await getComposantsList([CIS]);
});

export const getComposantsList = cache(async (CISList: string[]): Promise<BdpmComposant[]> => {
  if (CISList.length > 0) {
    return db
      .selectFrom("bdpm_composant")
      .where("cis", "in", CISList)
      .selectAll()
      .execute();
  }
  return [];
});
