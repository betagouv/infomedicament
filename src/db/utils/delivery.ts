import "server-cli-only";

import { cache } from "react";
import db from "@/db";
import { DeliveryCondition } from "@/types/DeliveryTypes";

export const getDeliveryConditions = cache(
  async (CIS: string): Promise<DeliveryCondition[]> => {
    const rows = await db
      .selectFrom("ansm_specialite_delivrance")
      .innerJoin(
        "ansm_delivrance",
        "ansm_delivrance.code",
        "ansm_specialite_delivrance.code_delivrance",
      )
      .where("ansm_specialite_delivrance.cis", "=", CIS)
      .select([
        "ansm_delivrance.code",
        "ansm_delivrance.libelle_court",
        "ansm_delivrance.libelle_long",
      ])
      .orderBy("ansm_delivrance.libelle_long")
      .execute();

    return rows.map((row) => ({
      code: row.code,
      shortLabel: row.libelle_court?.trim() || "Condition non communiquée",
      longLabel:
        row.libelle_long?.trim() ||
        row.libelle_court?.trim() ||
        "Condition non communiquée",
    }));
  },
);
