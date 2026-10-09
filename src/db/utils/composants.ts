"use server";
import "server-cli-only";

import db from "@/db";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import { toCompositionComponents } from "./substanceCatalog";

export async function getComposants(CIS: string) {
  "use cache: remote";
  return getComposantsList([CIS]);
}

export async function getComposantsList(CISList: string[]): Promise<CompositionComponent[]> {
  "use cache: remote";
    if (CISList.length === 0) return [];

    const [components, elements] = await Promise.all([
      db
        .selectFrom("ansm_composant")
        .where("cis", "in", CISList)
        .selectAll()
        .execute(),
      db
        .selectFrom("ansm_element")
        .where("cis", "in", CISList)
        .selectAll()
        .execute(),
    ]);
    const codes = [
      ...new Set(
        components.flatMap((component) =>
          component.code_substance ? [component.code_substance] : [],
        ),
      ),
    ];
    const names =
      codes.length === 0
        ? []
        : await db
            .selectFrom("ansm_substance_nom")
            .where("code_substance", "in", codes)
            .selectAll()
            .execute();

    return toCompositionComponents(components, names, elements);
  }
