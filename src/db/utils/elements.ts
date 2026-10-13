"use server";
import "server-cli-only";

import { cache } from "react";
import db from "@/db";
import type { AnsmElement } from "@/db/types";

export const getElements = cache(async (CIS: string): Promise<AnsmElement[]> => {
  "use cache: remote";
  return db.selectFrom("ansm_element")
    .where("cis", "=", CIS)
    .selectAll()
    .execute();
});

export const getElementsList = cache(async (CISList: string[]): Promise<AnsmElement[]> => {
  "use cache: remote";
  if (CISList.length === 0) return [];
  // A primitive CIS cache key lets independently-created single-item arrays
  // share the same query during a server render.
  if (CISList.length === 1) return getElements(CISList[0]);
  return db.selectFrom("ansm_element")
    .where("cis", "in", CISList)
    .selectAll()
    .execute();
});
