import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAtc, getAtc1, getAtc2, getAtc1DefinitionData, getSubstancesByAtc } from "./atc";
import type { ATC, ATC1 } from "@/types/ATCTypes";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(), components: vi.fn(), resumes: vi.fn(),
  tables: {} as Record<string, Record<string, unknown>[]>,
}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("./composants", () => ({ getComposantsList: mocks.components }));
vi.mock("./substances", () => ({ getSubstancesResume: mocks.resumes }));
vi.mock("@/db/", () => ({
  default: {
    selectFrom(table: string) {
      const predicates: ((row: Record<string, unknown>) => boolean)[] = [];
      const run = () => {
        mocks.execute(table);
        return (mocks.tables[table] ?? []).filter((row) => predicates.every((test) => test(row)));
      };
      const query = {
        select: () => query,
        innerJoin: () => query,
        where(column: string, operator: string, value: string | string[]) {
          const key = column === "atc.code" ? "atc_code" : column;
          predicates.push((row) => operator === "in"
            ? (value as string[]).includes(row[key] as string)
            : operator === "like"
              ? typeof row[key] === "string" && (row[key] as string).startsWith((value as string).slice(0, -1))
              : row[key] === value);
          return query;
        },
        execute: async () => run(),
        executeTakeFirst: async () => run()[0],
      };
      return query;
    },
  },
}));

function atc(code: string, children?: ATC[]): ATC {
  return { code, label: code, description: "", ...(children ? { children } : {}) };
}

describe("batched ATC loading", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.tables = {
      ref_atc_friendly_niveau_1: [{ code: "A", libelle: "A class", definition_classe: "A description" }, { code: "B", libelle: "B class", definition_classe: "B description" }],
      ref_atc_friendly_niveau_2: ["A01", "A02", "A03", "B01"].map((code) => ({ code, libelle: code, definition_sous_classe: `${code} description` })),
      atc: ["A01", "A01AA", "A02BB", "B01CC"].map((code) => ({ code, label_court: `${code} label` })),
      cis_atc: [
        { atc_code: "A01AA", code_cis: "shared" },
        { atc_code: "A01AA", code_cis: "shared" },
        { atc_code: "A01AA", code_cis: "hidden" },
        { atc_code: "A01AA", code_cis: null },
        { atc_code: "A02BB", code_cis: "shared" },
        { atc_code: "A02BB", code_cis: "second" },
      ],
      ansm_specialite: [
        { cis: "shared", disponibilite: "DISPONIBLE" },
        { cis: "second", disponibilite: "DISPONIBLE" },
        { cis: "hidden", disponibilite: "INDISPONIBLE" },
      ],
    };
    mocks.components.mockResolvedValue([
      { SpecId: "shared", SubsId: "s1", NomId: "n1", NomLib: "First" },
      { SpecId: "second", SubsId: "s2", NomId: "n2", NomLib: "Second" },
    ]);
    mocks.resumes.mockResolvedValue([{ NomId: "n2", NomLib: "Second" }, { NomId: "n1", NomLib: "First" }]);
  });

  it("loads the whole hierarchy with three queries regardless of subclass count", async () => {
    const result = await getAtc();
    expect(result.map((parent) => [parent.code, parent.children.map((child) => [child.code, child.children?.map((leaf) => leaf.code)])])).toEqual([
      ["A", [["A01", ["A01", "A01AA"]], ["A02", ["A02BB"]], ["A03", []]]],
      ["B", [["B01", ["B01CC"]]]],
    ]);
    expect(result[0]).toMatchObject({ label: "A class", description: "A description" });
    expect(result[0].children[0]).toMatchObject({ description: "A01 description", children: [{ code: "A01", label: "A01 label", description: "" }, { code: "A01AA", label: "A01AA label", description: "" }] });
    expect(mocks.execute).toHaveBeenCalledTimes(3);
  });

  it("loads a parent hierarchy in three queries and preserves long-code normalization", async () => {
    const result = await getAtc1("A01AA");
    expect(result.code).toBe("A");
    expect(result.children.map((child) => child.code)).toEqual(["A01", "A02", "A03"]);
    expect(result.children[1].children?.map((child) => child.code)).toEqual(["A02BB"]);
    expect(mocks.execute).toHaveBeenCalledTimes(3);
  });

  it("retains the ATC2 descendant prefix and missing-class errors", async () => {
    expect((await getAtc2("A01AA")).children?.map((child) => child.code)).toEqual(["A01AA"]);
    await expect(getAtc1("Z")).rejects.toThrow("ATC code not found: Z");
    await expect(getAtc2("Z99")).rejects.toThrow("ATC code not found: Z99");
  });

  it("fetches CIS relationships once and preserves shared, visible, summary-backed substances", async () => {
    const parent: ATC1 = { ...atc("A"), children: [atc("A01", [atc("A01AA")]), atc("A02", [atc("A02BB")]), atc("A03", [])] };
    const result = await getAtc1DefinitionData(parent);
    expect(result.map((entry) => [entry.atc.code, entry.substances.map((substance) => substance.NomId)])).toEqual([
      ["A01", ["n1"]], ["A02", ["n2", "n1"]], ["A03", []],
    ]);
    expect(mocks.execute.mock.calls.filter(([table]) => table === "cis_atc")).toHaveLength(1);
    expect(mocks.components).toHaveBeenCalledExactlyOnceWith(["shared", "second"]);
    expect(mocks.resumes).toHaveBeenCalledExactlyOnceWith(["n1", "n2"]);
  });

  it("does not query for parents without descendant codes", async () => {
    const parent: ATC1 = { ...atc("A"), children: [atc("A01"), atc("A02", [])] };
    expect((await getAtc1DefinitionData(parent)).map((entry) => entry.substances)).toEqual([[], []]);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.components).not.toHaveBeenCalled();
  });

  it("keeps the single-subclass lookup limited to its exact descendants", async () => {
    mocks.tables.cis_atc.push({ atc_code: "A01ZZ", code_cis: "unrelated" });
    mocks.components.mockResolvedValue([
      { SubsId: "s1", NomId: "n1", NomLib: "First" },
      { SubsId: "s1", NomId: "n1", NomLib: "First" },
    ]);
    expect(await getSubstancesByAtc(atc("A01", [atc("A01AA")]))).toEqual([
      { SubsId: "s1", NomId: "n1", NomLib: "First" },
    ]);
    expect(mocks.components).toHaveBeenCalledExactlyOnceWith(["shared"]);
  });

  it("stops after membership lookup when no medicine matches", async () => {
    mocks.tables.cis_atc = [];
    const parent: ATC1 = { ...atc("A"), children: [atc("A01", [atc("A01AA")])] };
    expect((await getAtc1DefinitionData(parent))[0].substances).toEqual([]);
    expect(mocks.execute).toHaveBeenCalledExactlyOnceWith("cis_atc");
    expect(mocks.components).not.toHaveBeenCalled();
    expect(mocks.resumes).not.toHaveBeenCalled();
  });
});
