import { describe, it, expect } from "vitest";
import { vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));

import { pdbmMySQL } from "@/db/pdbmMySQL";
import db from "@/db";
import { PdbmMySQL, PresentationComm, PresentationStat } from "@/db/pdbmMySQL/types";
import { expressionBuilder, sql } from "kysely";

const presentationIsComm = () => {
  const eb = expressionBuilder<PdbmMySQL, "Presentation">();
  return eb.and([
    eb.or([
      eb("Presentation.CommId", "=", PresentationComm.Commercialisation),
      eb.and([
        eb("Presentation.CommId", "in", [
          PresentationComm["Arrêt"],
          PresentationComm.Suspension,
          PresentationComm["Plus d'autorisation"],
        ]),
        eb("Presentation.PresCommDate", ">=", sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`),
      ]),
    ]),
    eb.or([
      eb("Presentation.StatId", "is", null),
      eb("Presentation.StatId", "!=", PresentationStat.Abrogation),
      eb("Presentation.PresStatDAte", ">=", sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`),
    ]),
  ]);
};

const TEST_CIS = "62998997"; // Spasfon injectable

describe("ansm_presentation parity", () => {
  it("same CIP13 set for a known CIS", async () => {
    const mysqlRows = await pdbmMySQL
      .selectFrom("Presentation")
      .where("SpecId", "=", TEST_CIS)
      .where(presentationIsComm())
      .select("codeCIP13")
      .execute();

    const bdpmRows = await db
      .selectFrom("ansm_presentation")
      .where("cis", "=", TEST_CIS)
      .where("statut_commercialisation", "not in", ["RETIREE", "SUSPENDUE", "NON_COMMUNIQUEE"])
      .select("cip")
      .execute();

    const mysqlCips = mysqlRows.map((r) => r.codeCIP13).sort();
    const bdpmCips = bdpmRows.map((r) => r.cip).sort();

    expect(bdpmCips).toEqual(mysqlCips);
  });

  it("denomination matches PresNom01 for known CIS", async () => {
    const mysqlRows = await pdbmMySQL
      .selectFrom("Presentation")
      .where("SpecId", "=", TEST_CIS)
      .where(presentationIsComm())
      .select(["codeCIP13", "PresNom01"])
      .execute();

    const bdpmRows = await db
      .selectFrom("ansm_presentation")
      .where("cis", "=", TEST_CIS)
      .where("statut_commercialisation", "not in", ["RETIREE", "SUSPENDUE", "NON_COMMUNIQUEE"])
      .select(["cip", "denomination"])
      .execute();

    for (const mysql of mysqlRows) {
      const bdpm = bdpmRows.find((r) => r.cip === mysql.codeCIP13);
      expect(bdpm).toBeDefined();
      expect(bdpm?.denomination?.trim()).toEqual(mysql.PresNom01.trim());
    }
  });
});
