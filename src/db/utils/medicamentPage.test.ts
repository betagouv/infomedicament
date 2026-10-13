import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMedicamentPageData } from "./medicamentPage";

const mocks = vi.hoisted(() => ({
  detailed: vi.fn(),
  specialite: vi.fn(),
  composants: vi.fn(),
  atcCode: vi.fn(),
  atc1: vi.fn(),
  atc2: vi.fn(),
  indications: vi.fn(),
  pathologies: vi.fn(),
  princeps: vi.fn(),
  generic: vi.fn(),
  notice: vi.fn(),
  articles: vi.fn(),
}));
vi.mock("./specialities", () => ({
  getDetailedSpecialite: mocks.detailed,
  getSpecialite: mocks.specialite,
}));
vi.mock("./composants", () => ({ getComposants: mocks.composants }));
vi.mock("@/utils/atc", () => ({ getAtcCode: mocks.atcCode }));
vi.mock("./atc", () => ({ getAtc1: mocks.atc1, getAtc2: mocks.atc2 }));
vi.mock("./indications", () => ({
  getSpecialitesIndications: mocks.indications,
  getSpecialitePathologies: mocks.pathologies,
}));
vi.mock("./generics", () => ({
  isPrincepsSpecialite: mocks.princeps,
  isGenericSpecialite: mocks.generic,
}));
vi.mock("./notice", () => ({ getNotice: mocks.notice }));
vi.mock("./articles", () => ({ getArticlesFromFilters: mocks.articles }));
vi.mock("./pregnancy", () => ({
  getAllPregnancyPlanAlerts: async () => [],
  getPregnancyMentionAlert: async () => false,
}));
vi.mock("./pregnancyCatalog", () => ({
  findPregnancyPlanAlert: () => undefined,
}));
vi.mock("./pediatrics", () => ({ getPediatrics: async () => undefined }));
vi.mock("./marr", () => ({ getMarr: async () => undefined }));
vi.mock("./ficheInfos", () => ({ getFicheInfos: async () => ({}) }));
vi.mock("./glossary", () => ({
  getHighlightedGlossaryDefinitions: async () => [],
}));
vi.mock("./videos", () => ({ getVideosFromCIS: async () => [] }));
vi.mock("./stocks", () => ({ getStockFromCIS: async () => [] }));
vi.mock("@/utils/noticeHtml", () => ({
  getIndicationsBlock: () => "indications",
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("medicine page loading", () => {
  const specialite = { SpecId: "123", SpecDenom01: "Medicine" };
  const specialiteData = {
    specialite,
    composants: [],
    presentations: [],
    delivrance: [],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.detailed.mockResolvedValue(specialite);
    mocks.specialite.mockResolvedValue(specialiteData);
    mocks.composants.mockResolvedValue([{ SubsId: " ingredient " }]);
    mocks.atcCode.mockResolvedValue("A01AA");
    mocks.atc1.mockResolvedValue({ code: "A", label: "Class" });
    mocks.atc2.mockResolvedValue({ code: "A01", label: "Subclass" });
    mocks.indications.mockResolvedValue([{ idIndication: 1 }]);
    mocks.pathologies.mockResolvedValue([2]);
    mocks.princeps.mockResolvedValue(true);
    mocks.generic.mockResolvedValue(false);
    mocks.notice.mockResolvedValue({ contentHtml: "notice" });
    mocks.articles.mockResolvedValue([{ title: "Article" }]);
  });

  it("starts documents and both ATC levels before slow presentation assembly finishes", async () => {
    const assembly = deferred<typeof specialiteData>();
    const atc1 = deferred<{ code: string; label: string }>();
    mocks.specialite.mockReturnValue(assembly.promise);
    mocks.atc1.mockReturnValue(atc1.promise);
    const loading = getMedicamentPageData("123");

    await vi.waitFor(() => {
      expect(mocks.notice).toHaveBeenCalledWith("123");
      expect(mocks.indications).toHaveBeenCalledWith(["123"]);
      expect(mocks.princeps).toHaveBeenCalledWith("123");
      expect(mocks.generic).toHaveBeenCalledWith("123");
      expect(mocks.atc2).toHaveBeenCalledWith("A01AA");
    });

    atc1.resolve({ code: "A", label: "Class" });
    assembly.resolve(specialiteData);
    const result = await loading;
    expect(result).toMatchObject({ ...specialiteData, atcList: ["A", "A01"] });
    expect(await result.medData).toMatchObject({
      notice: { contentHtml: "notice" },
      indicationsBlock: "indications",
      isPrinceps: true,
      isGeneric: false,
    });
  });

  it("loads articles as soon as their filters are ready while the notice is pending", async () => {
    const notice = deferred<{ contentHtml: string }>();
    mocks.notice.mockReturnValue(notice.promise);
    const loading = getMedicamentPageData("123");

    await vi.waitFor(() =>
      expect(mocks.articles).toHaveBeenCalledWith({
        ATCList: ["A", "A01"],
        substancesList: ["ingredient"],
        specialitesList: ["123"],
        pathologiesList: [2],
      }),
    );
    // The header data must resolve while the notice is still pending.
    const page = await loading;
    expect(page.specialite).toEqual(specialite);
    let contentResolved = false;
    void page.medData?.then(() => {
      contentResolved = true;
    });
    await Promise.resolve();
    expect(contentResolved).toBe(false);
    notice.resolve({ contentHtml: "notice" });
    expect((await page.medData)?.articles).toEqual([{ title: "Article" }]);
  });

  it("does not request unrelated data for an unavailable specialty", async () => {
    mocks.detailed.mockResolvedValue(undefined);
    mocks.specialite.mockResolvedValue({
      ...specialiteData,
      specialite: undefined,
    });
    expect(await getMedicamentPageData("123")).toMatchObject({
      specialite: undefined,
      medData: undefined,
      atcList: [],
    });
    for (const mock of [
      mocks.atcCode,
      mocks.notice,
      mocks.composants,
      mocks.articles,
      mocks.indications,
      mocks.princeps,
      mocks.generic,
    ]) {
      expect(mock).not.toHaveBeenCalled();
    }
  });

  it("handles medicines without an ATC code", async () => {
    mocks.atcCode.mockResolvedValue(undefined);
    const result = await getMedicamentPageData("123");
    await result.medData;
    expect(result.atcList).toEqual([]);
    expect(mocks.atc1).not.toHaveBeenCalled();
    expect(mocks.atc2).not.toHaveBeenCalled();
    expect(mocks.articles).toHaveBeenCalledWith(
      expect.objectContaining({ ATCList: [] }),
    );
  });
});
