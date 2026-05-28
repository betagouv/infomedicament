import { describe, it, expect } from "vitest";
import { vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

import { pdbmMySQL } from "@/db/pdbmMySQL";
import db from "@/db";

describe("getSubstanceSpecialitesCIS parity", () => {
  it("same CIS set for a known NomId (single substance)", async () => {
    const sample = await db
      .selectFrom("resume_substances")
      .select(["NomId", "SubsId"])
      .limit(1)
      .executeTakeFirstOrThrow();

    const nomId = sample.NomId;
    const subsId = sample.SubsId;

    const mysqlRows = await pdbmMySQL
      .selectFrom("Specialite")
      .innerJoin("Composant", "Specialite.SpecId", "Composant.SpecId")
      .where("Composant.NomId", "=", nomId)
      .where("Specialite.IsBdm", "=", 1)
      .select("Specialite.SpecId")
      .distinct()
      .execute();

    const bdpmRows = await db
      .selectFrom("bdpm_composant")
      .innerJoin("bdpm_specialite", "bdpm_specialite.cis", "bdpm_composant.cis")
      .where("bdpm_composant.code_substance", "=", subsId)
      .where("bdpm_specialite.statut_amm", "=", "ACTIVE")
      .select("bdpm_specialite.cis")
      .distinct()
      .execute();

    const mysqlCIS = mysqlRows.map((r) => r.SpecId).sort();
    const bdpmCIS = bdpmRows.map((r) => r.cis).sort();

    expect(bdpmCIS).toEqual(mysqlCIS);
  });
});
