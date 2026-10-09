import { beforeAll, describe, expect, it, vi } from "vitest";
import { sql } from "kysely";
import db from "..";
import { getSpecialitesExport } from "./export";
import { ExportSpecs } from "@/types/ExportTypes";
import { isAIP } from "@/utils/specialites";

vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));

const ATC2_CODE = "A03";

describe("getSpecialitesExport", () => {
  let atcResults: ExportSpecs[];

  beforeAll(async () => {
    atcResults = await getSpecialitesExport({ atc2Codes: [ATC2_CODE] });
  });

  it("filters by ATC2 class", async () => {
    const { count } = await db
      .selectFrom("resume_specialites")
      .select((eb) => eb.fn.countAll<string>().as("count"))
      .where("atc2Code", "=", ATC2_CODE)
      .executeTakeFirstOrThrow();
    expect(atcResults.length).toBeGreaterThan(0);
    expect(atcResults.length).toBe(Number(count));
    expect(atcResults.every((spec) => spec.atc2Code === ATC2_CODE)).toBe(true);
  });

  it("filters by substance", async () => {
    const subsId = atcResults[0].subsIds[0];
    const results = await getSpecialitesExport({ subsIds: [subsId] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((spec) => spec.subsIds.includes(subsId))).toBe(true);
  });

  it("combines substances and ATC2 classes with a OR", async () => {
    const resumeSpec = await db
      .selectFrom("resume_specialites")
      .select(["specId", "subsIds"])
      .where("atc2Code", "!=", ATC2_CODE)
      .where((eb) => eb.fn("cardinality", ["subsIds"]), ">", 0)
      .limit(1)
      .executeTakeFirstOrThrow();
    const subsId = resumeSpec.subsIds[0];

    const subsResults = await getSpecialitesExport({ subsIds: [subsId] });
    const results = await getSpecialitesExport({ subsIds: [subsId], atc2Codes: [ATC2_CODE] });

    const expectedSpecsIds = new Set([...atcResults, ...subsResults].map((spec) => spec.specId));
    expect(results.map((spec) => spec.specId).sort()).toEqual([...expectedSpecsIds].sort());
    expect(results.some((spec) => spec.specId === resumeSpec.specId)).toBe(true);
  });

  it("returns an empty list when there is no filter", async () => {
    expect(await getSpecialitesExport({})).toEqual([]);
    expect(await getSpecialitesExport({ subsIds: [], atc2Codes: [] })).toEqual([]);
  });

  it("loads the AMM status", async () => {
    const results = atcResults;
    const statuts = await db
      .selectFrom("ansm_specialite")
      .select(["cis", "statut_amm"])
      .where("cis", "in", results.map((spec) => spec.specId))
      .execute();
    const statusByCIS = new Map(statuts.map((s) => [s.cis.trim(), s.statut_amm]));
    for (const spec of results) {
      expect(spec.ammActiveFrance).toBe(statusByCIS.get(spec.specId) === "ACTIVE");
    }
  });

  it("loads the generic group, except for the AIP", async () => {
    const results = atcResults;
    expect(results.every((spec) => typeof spec.genericGroup === "string")).toBe(true);
    expect(results.some((spec) => spec.genericGroup !== "")).toBe(true);
    for (const spec of results.filter(isAIP)) {
      expect(spec.genericGroup).toBe("");
    }
  });

  it("loads all the RCP sections", () => {
    for (const [key, sectionNumber] of [["rcp43", "4.3"], ["rcp44", "4.4"], ["rcp45", "4.5"]] as const) {
      const withSection = atcResults.filter((spec) => spec[key]);
      expect(withSection.length).toBeGreaterThan(0);
      for (const spec of withSection) {
        expect(spec[key]?.startsWith(sectionNumber)).toBe(true);
      }
    }
  });

  it("leaves the RCP sections empty when there is no RCP", async () => {
    const specWithoutRcp = await db
      .selectFrom("resume_specialites")
      .select(["specId", "atc2Code"])
      .where("atc2Code", "is not", null)
      .where(({ not, exists, selectFrom }) => not(exists(
        selectFrom("rcp")
          .select("codeCIS")
          .where("rcp.codeCIS", "=", sql<number>`cast(resume_specialites."specId" as bigint)`),
      )))
      .limit(1)
      .executeTakeFirst();
    if (!specWithoutRcp) return;

    const results = await getSpecialitesExport({ atc2Codes: [specWithoutRcp.atc2Code!] });
    const spec = results.find((s) => s.specId === specWithoutRcp.specId);
    expect(spec).toBeDefined();
    expect(spec?.rcp43).toBeUndefined();
    expect(spec?.rcp44).toBeUndefined();
    expect(spec?.rcp45).toBeUndefined();
  });
});
