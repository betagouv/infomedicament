"use server";
import "server-cli-only";

import { cache } from "react";
import db from "@/db";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import { mapAnsmComposition } from "./substanceCatalog";

export const getComposants = cache(async function (CIS: string) {
  return getComposantsList([CIS]);
});

export const getComposantsList = cache(async (
  CISList: string[],
): Promise<CompositionComponent[]> => {
  if (CISList.length === 0) return [];

  const [components, elements] = await Promise.all([
    db.selectFrom("ansm_composant").where("cis", "in", CISList).selectAll().execute(),
    db.selectFrom("ansm_element").where("cis", "in", CISList).selectAll().execute(),
  ]);
  const codes = [...new Set(components.flatMap((component) =>
    component.code_substance ? [component.code_substance] : [],
  ))];
  const names = codes.length === 0
    ? []
    : await db
      .selectFrom("ansm_substance_nom")
      .where("code_substance", "in", codes)
      .selectAll()
      .execute();

  return mapAnsmComposition(components, names, elements);
});
