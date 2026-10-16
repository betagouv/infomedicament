"use server";
import "server-cli-only";

import db from "@/db";
import type { AnsmElement } from "@/db/types";

export async function getElements(CIS: string): Promise<AnsmElement[]> {
  "use cache: remote";
  return db
    .selectFrom("ansm_element")
    .where("cis", "=", CIS)
    .selectAll()
    .execute();
}

export async function getElementsList(
  CISList: string[],
): Promise<AnsmElement[]> {
  "use cache: remote";
  if (CISList.length === 0) return [];
  // Route single-medicine lookups through the same remote cache entry.
  if (CISList.length === 1) return getElements(CISList[0]);
  return db
    .selectFrom("ansm_element")
    .where("cis", "in", CISList)
    .selectAll()
    .execute();
}
