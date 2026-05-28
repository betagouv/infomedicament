import { describe, it, expect, vi } from "vitest";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import db from "@/db";

vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));

// Spasfon solution injectable — well-known single-composant drug
const CIS_SPASFON = "62998997";

describe("bdpm_composant + bdpm_element parity", () => {
  it("same composant count for a known CIS", async () => {
    const mysqlRows = await pdbmMySQL
      .selectFrom("Composant")
      .where("SpecId", "=", CIS_SPASFON)
      .selectAll()
      .distinct()
      .execute();

    const pgRows = await db
      .selectFrom("bdpm_composant")
      .where("cis", "=", CIS_SPASFON)
      .selectAll()
      .execute();

    expect(pgRows.length).toBe(mysqlRows.length);
  });

  it("same substance names for a known CIS", async () => {
    const mysqlSubstances = await pdbmMySQL
      .selectFrom("Composant")
      .innerJoin("Subs_Nom", "Composant.NomId", "Subs_Nom.NomId")
      .where("Composant.SpecId", "=", CIS_SPASFON)
      .select("Subs_Nom.NomLib")
      .distinct()
      .execute();

    const pgSubstances = await db
      .selectFrom("bdpm_composant")
      .where("cis", "=", CIS_SPASFON)
      .select("substance")
      .distinct()
      .execute();

    const mysqlNames = mysqlSubstances.map((r) => r.NomLib.trim().toLowerCase()).sort();
    const pgNames = pgSubstances.map((r) => (r.substance ?? "").trim().toLowerCase()).sort();

    expect(pgNames).toEqual(mysqlNames);
  });

  it("same element count for a known CIS", async () => {
    const mysqlElements = await pdbmMySQL
      .selectFrom("Element")
      .where("SpecId", "=", CIS_SPASFON)
      .selectAll()
      .execute();

    const pgElements = await db
      .selectFrom("bdpm_element")
      .where("cis", "=", CIS_SPASFON)
      .selectAll()
      .execute();

    expect(pgElements.length).toBe(mysqlElements.length);
  });
});
