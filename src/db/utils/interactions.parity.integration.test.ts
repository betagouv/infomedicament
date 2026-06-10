import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));

import db from "@/db";

describe("ansm_interaction parity", () => {
  it("row count is within 10% of triam_interactions (excluding historique)", async () => {
    const [triamResult, bdpmResult] = await Promise.all([
      db
        .selectFrom("triam_interactions")
        .where("historique", "=", false)
        .select((eb) => eb.fn.countAll<number>().as("count"))
        .executeTakeFirstOrThrow(),
      db
        .selectFrom("ansm_interaction")
        .select((eb) => eb.fn.countAll<number>().as("count"))
        .executeTakeFirstOrThrow(),
    ]);
    const ratio = Number(bdpmResult.count) / Number(triamResult.count);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it("ansm_groupe_substance has substance groups for common molecules", async () => {
    const [ibup, sert] = await Promise.all([
      db.selectFrom("ansm_groupe_substance").where("nom", "ilike", "%ibuprof%").select("code_groupe").executeTakeFirst(),
      db.selectFrom("ansm_groupe_substance").where("nom", "ilike", "%sertraline%").select("code_groupe").executeTakeFirst(),
    ]);
    expect(ibup).toBeDefined();
    expect(sert).toBeDefined();
  });

  it("ansm_classe_interaction has class entries for common classes", async () => {
    const pamplemousse = await db
      .selectFrom("ansm_classe_interaction")
      .where("nom", "ilike", "%pamplemousse%")
      .select("code_classe")
      .executeTakeFirst();
    expect(pamplemousse).toBeDefined();
  });
});
