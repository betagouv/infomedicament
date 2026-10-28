import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getGenericGroupMembership,
  isGenericSpecialite,
  isPrincepsSpecialite,
} from "./generics";
import { getComposants } from "./composants";
import { getFicheInfos } from "./ficheInfos";
import { getPresentationsDetails } from "./presentation";
import { getElements, getElementsList } from "./elements";

const mocks = vi.hoisted(() => ({
  queries: vi.fn(),
  tables: {} as Record<string, Record<string, unknown>[]>,
}));

// Next.js compiles the cache directives; plain Vitest exercises lookup results
// without simulating the production cache or asserting deduplication.
vi.mock("@/db/pdbmMySQL", () => ({ pdbmMySQL: {} }));
vi.mock("./safety", () => ({
  getImportantInformationEvents: async () => [],
  getReinforcedSurveillanceEvents: async () => [],
}));
vi.mock("@/db", () => ({
  default: {
    selectFrom(table: string) {
      const predicates: ((row: Record<string, unknown>) => boolean)[] = [];
      const orders: string[] = [];
      const run = () => {
        mocks.queries(table);
        return (mocks.tables[table] ?? [])
          .filter((row) => predicates.every((test) => test(row)))
          .sort((a, b) => {
            for (const key of orders) {
              if (a[key] === b[key]) continue;
              return a[key]! < b[key]! ? -1 : 1;
            }
            return 0;
          });
      };
      const query = {
        select: () => query,
        selectAll: () => query,
        innerJoin: () => query,
        leftJoin: () => query,
        distinct: () => query,
        orderBy(column: string) {
          orders.push(column.split(".").at(-1)!);
          return query;
        },
        where(column: string, operator: string, value: unknown) {
          const key = column.split(".").at(-1)!;
          predicates.push((row) =>
            operator === "in"
              ? (value as unknown[]).includes(row[key])
              : row[key] === value,
          );
          return query;
        },
        execute: async () => run(),
        executeTakeFirst: async () => run()[0],
      };
      return query;
    },
  },
}));

beforeEach(() => {
  mocks.queries.mockClear();
  mocks.tables = {};
});

describe("generic membership reuse", () => {
  it("preserves membership and classification for mixed roles", async () => {
    mocks.tables.ansm_specialite_groupe_generique = [
      { cis: "123", code_groupe: 20, role: "REFERENCE", rang: 2 },
      {
        cis: "123",
        code_groupe: 10,
        role: "GENERIQUE",
        rang: 1,
        libelle: "REFERENCE 10 mg - REFERENCE 10 mg, comprimé",
      },
      {
        cis: "reference",
        denomination: "Reference medicine",
        code_groupe: 10,
        role: "REFERENCE",
        rang: 1,
      },
    ];
    const [membership, princeps, generic] = await Promise.all([
      getGenericGroupMembership("123"),
      isPrincepsSpecialite("123"),
      isGenericSpecialite("123"),
    ]);
    expect(membership).toEqual({
      codeGroupe: 10,
      groupName: "REFERENCE 10 mg - REFERENCE 10 mg, comprimé",
      referenceCis: "reference",
      referenceName: "Reference medicine",
    });
    expect(princeps).toBe(true);
    expect(generic).toBe(true);
  });

  it.each([
    ["REFERENCE", true, false],
    ["COMPLEMENTARITE_POSOLOGIQUE", true, false],
    ["GENERIQUE", false, true],
    ["GENERIQUE_AVEC_COMPLEMENTARITE_POSOLOGIQUE", false, true],
    ["SUBSTITUTION", false, true],
    [null, false, false],
    ["OTHER", false, false],
  ])(
    "preserves classification for %s",
    async (role, expectedPrinceps, expectedGeneric) => {
      mocks.tables.ansm_specialite_groupe_generique = [
        { cis: "123", code_groupe: 10, role },
      ];
      expect(
        await Promise.all([
          isPrincepsSpecialite("123"),
          isGenericSpecialite("123"),
        ]),
      ).toEqual([expectedPrinceps, expectedGeneric]);
    },
  );

  it("handles empty membership results", async () => {
    expect(
      await Promise.all([
        getGenericGroupMembership("unknown"),
        isPrincepsSpecialite("unknown"),
        isGenericSpecialite("unknown"),
      ]),
    ).toEqual([undefined, false, false]);
  });
});

describe("medicine element reuse", () => {
  it("loads composition, fiche and packaging without mutating element order", async () => {
    mocks.tables.ansm_element = [
      { cis: "123", numero_element: 2, ordre: 2, denomination: "Second" },
      { cis: "123", numero_element: 1, ordre: 1, denomination: "First" },
    ];
    mocks.tables.ansm_presentation = [
      { cis: "123", cip: "456", denomination: "Package" },
    ];
    mocks.tables.ansm_recipient = [
      { cip: "456", numero_element: 2, numero_recipient: 1 },
    ];

    const [components, fiche, packaging, elements] = await Promise.all([
      getComposants("123"),
      getFicheInfos("123"),
      getPresentationsDetails(["456"]),
      getElementsList(["123"]),
    ]);
    expect(components).toEqual([]);
    expect(
      fiche?.listeElements.map((element) => element.referenceDosage),
    ).toEqual(["First", "Second"]);
    expect(packaging[0]).toMatchObject({ nomelement: "Second", numelement: 2 });
    expect(elements.map((element) => element.numero_element)).toEqual([2, 1]);
    expect(await getElements("123")).toEqual(elements);
  });

  it("retains bulk fetching for multiple medicines and skips empty lists", async () => {
    mocks.tables.ansm_element = [
      { cis: "123", numero_element: 1 },
      { cis: "456", numero_element: 1 },
      { cis: "789", numero_element: 1 },
    ];
    expect(await getElementsList([])).toEqual([]);
    expect(mocks.queries).not.toHaveBeenCalled();
    expect(
      (await getElementsList(["123", "456"])).map((element) => element.cis),
    ).toEqual(["123", "456"]);
    expect(mocks.queries).toHaveBeenCalledExactlyOnceWith("ansm_element");
  });
});
