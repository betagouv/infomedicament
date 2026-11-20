import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSpecialite } from "./specialities";

const mocks = vi.hoisted(() => ({
  row: vi.fn(),
  composants: vi.fn(),
  presentations: vi.fn(),
  marketingPresentations: vi.fn(),
  delivrance: vi.fn(),
}));
vi.mock("./composants", () => ({ getComposants: mocks.composants }));
vi.mock("./presentation", () => ({
  getFullPresentations: mocks.presentations,
}));
vi.mock("./generics", () => ({
  getGenericGroupMembership: async () => undefined,
}));
vi.mock("./specialiteEen", () => ({ getEenLabel: async () => null }));
vi.mock("./substances", () => ({ getCisMatchingSubstanceSet: async () => [] }));
vi.mock("./specialiteCatalog", () => ({
  VISIBLE_SPECIALITE_AVAILABILITIES: ["DISPONIBLE"],
  mapDetailedSpecialite: (row: unknown) => row,
  mapCatalogSpecialite: (row: unknown) => row,
}));
vi.mock("@/db", () => ({
  default: {
    selectFrom(table: string) {
      const query = {
        where: () => query,
        selectAll: () => query,
        select: () => query,
        innerJoin: () => query,
        orderBy: () => query,
        executeTakeFirst: mocks.row,
        execute: () =>
          table === "ansm_specialite_delivrance"
            ? mocks.delivrance()
            : table === "ansm_presentation"
              ? mocks.marketingPresentations()
              : Promise.resolve([]),
      };
      return query;
    },
  },
}));

describe("specialty assembly", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.row.mockResolvedValue({ cis: "123" });
    mocks.presentations.mockResolvedValue([{ cip13: "456" }]);
    mocks.marketingPresentations.mockResolvedValue([]);
    mocks.delivrance.mockResolvedValue([{ code: 3 }]);
  });

  it("starts presentation and delivery lookups while composition is still pending", async () => {
    let resolveComponents!: (components: []) => void;
    mocks.composants.mockReturnValue(
      new Promise<[]>((resolve) => {
        resolveComponents = resolve;
      }),
    );
    const loading = getSpecialite("123");

    await vi.waitFor(() => {
      expect(mocks.presentations).toHaveBeenCalledWith("123");
      expect(mocks.delivrance).toHaveBeenCalledOnce();
    });
    resolveComponents([]);
    expect(await loading).toEqual({
      specialite: { cis: "123", marketingStatus: "unknown" },
      composants: [],
      presentations: [{ cip13: "456" }],
      delivrance: [{ code: 3 }],
    });
  });

  it("passes presentation-level marketing evidence to the medicine header", async () => {
    mocks.composants.mockResolvedValue([]);
    mocks.marketingPresentations.mockResolvedValue([
      {
        statut_commercialisation: "ARRETEE",
        date_commercialisation: new Date("2010-01-01"),
        date_arret_commercialisation: new Date("2020-01-01"),
      },
    ]);
    expect((await getSpecialite("123")).specialite?.marketingStatus).toBe(
      "stopped",
    );
  });

  it("returns empty related data without queries for an unavailable specialty", async () => {
    mocks.row.mockResolvedValue(undefined);
    expect(await getSpecialite("123")).toEqual({
      specialite: undefined,
      composants: [],
      presentations: [],
      delivrance: [],
    });
    expect(mocks.composants).not.toHaveBeenCalled();
    expect(mocks.presentations).not.toHaveBeenCalled();
    expect(mocks.delivrance).not.toHaveBeenCalled();
  });
});
