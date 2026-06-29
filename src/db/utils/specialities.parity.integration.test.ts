import { describe, it, expect, vi } from "vitest";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import db from "@/db";

vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

const CIS_ACTIVE = "60234100"; // DOLIPRANE 1000 mg, comprimé
const CIS_INACTIVE = "61933092"; // DOLIPRANE 500 mg, comprimé orodispersible (inactive)

describe("ansm_specialite parity", () => {
  it("active count is close between MySQL (IsBdm=1) and ansm (disponibilite!=INDISPONIBLE)", async () => {
    const mysqlResult = await pdbmMySQL
      .selectFrom("Specialite")
      .where("IsBdm", "=", 1)
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();

    const pgResult = await db
      .selectFrom("ansm_specialite")
      .where("disponibilite", "!=", "INDISPONIBLE")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .executeTakeFirstOrThrow();

    // disponibilite!=INDISPONIBLE is a very close equivalent of IsBdm=1 (~0.4% drift).
    // See DATA-GAPS.md #12.
    const ratio = Number(pgResult.count) / Number(mysqlResult.count);
    expect(ratio).toBeGreaterThan(0.98);
    expect(ratio).toBeLessThan(1.02);
  });

  it("known active CIS present and denomination matches", async () => {
    const mysqlSpec = await pdbmMySQL
      .selectFrom("Specialite")
      .where("SpecId", "=", CIS_ACTIVE)
      .select("SpecDenom01")
      .executeTakeFirst();

    const pgSpec = await db
      .selectFrom("ansm_specialite")
      .where("cis", "=", CIS_ACTIVE)
      .select("denomination")
      .executeTakeFirst();

    expect(mysqlSpec).toBeDefined();
    expect(pgSpec).toBeDefined();
    expect(pgSpec!.denomination?.trim()).toBe(mysqlSpec!.SpecDenom01.trim());
  });

  it("inactive CIS absent from IsBdm=1 / statut_amm=ACTIVE in both sources", async () => {
    const mysqlSpec = await pdbmMySQL
      .selectFrom("Specialite")
      .where("SpecId", "=", CIS_INACTIVE)
      .where("IsBdm", "=", 1)
      .select("SpecId")
      .executeTakeFirst();

    const pgSpec = await db
      .selectFrom("ansm_specialite")
      .where("cis", "=", CIS_INACTIVE)
      .where("disponibilite", "!=", "INDISPONIBLE")
      .select("cis")
      .executeTakeFirst();

    expect(mysqlSpec).toBeUndefined();
    expect(pgSpec).toBeUndefined();
  });

  it("getNoticeRcpLastUpdated parity: ansm_document max date is close to Document max date", async () => {
    const mysqlResult = await pdbmMySQL
      .selectFrom("Document")
      .select((eb) => eb.fn.max("DocDateMaj").as("lastUpdated"))
      .executeTakeFirst();

    const pgResult = await db
      .selectFrom("ansm_document")
      .select((eb) => eb.fn.max("date_modification").as("lastUpdated"))
      .executeTakeFirst();

    expect(mysqlResult?.lastUpdated).not.toBeNull();
    expect(pgResult?.lastUpdated).not.toBeNull();

    // Both dates should be within 30 days of each other
    const mysqlDate = new Date(mysqlResult!.lastUpdated!).getTime();
    const pgDate = new Date(pgResult!.lastUpdated!).getTime();
    const diffDays = Math.abs(mysqlDate - pgDate) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThan(30);
  });
});
