import { describe, it, expect, vi, beforeEach } from "vitest";

import { getAutocompleteSuggestions } from "./autocomplete";
import { getSynonymMap } from "./searchSynonyms";
import { getResumeSpecsATCLabels } from "./atc";
import { formatSpecialitesResume, getSpecSlug } from "@/utils/specialites";
import { getSearchResultsFromMatches } from "./search";
import { computeSortScore } from "./searchScoring";
import { formatSpecName } from "@/displayUtils";

const { dbMock, mockExecute } = vi.hoisted(() => {
  const execute = vi.fn();

  const mockDbInstance = {
    selectFrom: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    as: vi.fn().mockReturnThis(),
    execute,
  };

  return {
    dbMock: mockDbInstance,
    mockExecute: execute,
  };
});

vi.mock("@/db", () => ({
  default: dbMock,
}));

vi.mock("./atc");
vi.mock("./searchScoring", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./searchScoring")>();
  return { ...actual, computeSortScore: vi.fn(actual.computeSortScore) };
});
vi.mock("@/db/pdbmMySQL", () => ({ pdbmMySQL: {} }));
vi.mock("@/data/grist/specialites");
vi.mock("@/utils/specialites", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/specialites")>();
  return { ...actual, formatSpecialitesResume: vi.fn() };
});

vi.mock("./searchSynonyms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./searchSynonyms")>();
  return { ...actual, getSynonymMap: vi.fn() };
});

vi.mock("server-only", () => ({}));

const makeGroup = (groupName: string, composants = "") => ({
  groupName,
  composants,
  indicationsIds: [],
  atc1Code: "",
  atc2Code: "",
  atc5Code: "",
  subsIds: [],
  indicationsIdsNames: [],
  specId: "",
  specName: "",
  ProcId: "",
  isSurveillanceRenforcee: true,
  StatutBdm: 1,
  isAlertPregnancyPlan: true,
  isAlertPregnancyMention: true,
  isAlertPediatricContraindication: true,
});

describe("Autocomplete suggestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExecute.mockReset();
    vi.mocked(formatSpecialitesResume).mockImplementation((spec) =>
      spec.map((g: any) => ({ ...g, indicationsDetails: [] })),
    );
    vi.mocked(getResumeSpecsATCLabels).mockImplementation(async (spec) => spec);
    vi.mocked(getSynonymMap).mockResolvedValue([]);
  });

  it("surfaces a matched substance and linked medicines", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "substance", group_name: "DOLIPRANE", match_label: "Paracétamol", token: "paracetamol", spec_id: null, sml: 0.9 },
    ]);
    mockExecute.mockResolvedValueOnce([
      { ...makeGroup("DOLIPRANE", "Paracétamol"), specId: "61234567", specName: "DOLIPRANE 1000 mg" },
    ]);
    mockExecute.mockResolvedValueOnce([
      { SubsId: "123", NomLib: "Paracétamol" },
    ]);

    const sections = await getAutocompleteSuggestions("paracetamol");

    const substanceSection = sections.find((section) => section.type === "substance");
    const medicineSection = sections.find((section) => section.type === "specialite");

    expect(substanceSection?.items[0]).toMatchObject({
      label: "Paracétamol",
      href: "/substances/paracetamol-123",
    });
    expect(medicineSection?.items[0]).toMatchObject({
      href: "/medicaments/doliprane-1000-mg-61234567",
      matchReasons: [{ type: "substance", label: "Paracétamol" }],
    });
  });

  it("keeps an exact medicine name ahead of a substance with the same label", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "name", group_name: "PARACETAMOL", match_label: "PARACETAMOL", token: "paracetamol", spec_id: "70000001", sml: 1 },
      { match_type: "substance", group_name: "DOLIPRANE", match_label: "Paracétamol", token: "paracetamol", spec_id: null, sml: 1 },
    ]);
    mockExecute.mockResolvedValueOnce([
      { ...makeGroup("PARACETAMOL", "Paracétamol"), specId: "70000001", specName: "PARACETAMOL" },
      { ...makeGroup("DOLIPRANE", "Paracétamol"), specId: "61234567", specName: "DOLIPRANE 1000 mg" },
    ]);
    mockExecute.mockResolvedValueOnce([
      { SubsId: "123", NomLib: "Paracétamol" },
    ]);

    const sections = await getAutocompleteSuggestions("paracetamol");

    const medicineSection = sections.find((section) => section.type === "specialite");

    expect(medicineSection?.items.map((item) => item.href)).toContain("/medicaments/paracetamol-70000001");
  });

  it("uses cautious wording for indication-linked medicines", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "indication", group_name: "DOLIPRANE", match_label: "Migraine", token: "migraine", spec_id: null, sml: 0.95 },
    ]);
    mockExecute.mockResolvedValueOnce([
      { ...makeGroup("DOLIPRANE"), specId: "61234567", specName: "DOLIPRANE 1000 mg" },
    ]);
    mockExecute.mockResolvedValueOnce([
      { idIndication: 42, nomIndication: "Migraine" },
    ]);

    const sections = await getAutocompleteSuggestions("migraine");

    const indicationSection = sections.find((section) => section.type === "indication");
    const medicineSection = sections.find((section) => section.type === "specialite");

    expect(indicationSection?.items[0].href).toBe("/indications/migraine-42");
    expect(medicineSection?.items[0].matchReasons).toEqual([
      { type: "indication", label: "Migraine" },
    ]);
  });

  it("does not expose ATC as an autocomplete category", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "atc", group_name: "DOLIPRANE", match_label: "Antalgiques", token: "antalgiques", spec_id: null, sml: 0.9 },
    ]);
    mockExecute.mockResolvedValueOnce([
      { ...makeGroup("DOLIPRANE"), specId: "61234567", specName: "DOLIPRANE 1000 mg" },
    ]);

    const sections = await getAutocompleteSuggestions("antalgiques");

    expect(sections.map((section) => section.type)).toEqual(["specialite"]);
  });

  it("fetches only suggestion fields and skips unused enrichment and ordinary full-search scoring", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "name", group_name: "DOLIPRANE", match_label: "Doliprane", sml: 0.9 },
    ]).mockResolvedValueOnce([
      { specId: "123", specName: "DOLIPRANE", groupName: "DOLIPRANE", composants: "Paracétamol" },
    ]);
    expect((await getAutocompleteSuggestions("doli"))[0].items[0].href).toBe("/medicaments/doliprane-123");
    expect(dbMock.select).toHaveBeenCalledWith(["specId", "specName", "groupName", "composants"]);
    expect(mockExecute).toHaveBeenCalledTimes(2);
    expect(getResumeSpecsATCLabels).not.toHaveBeenCalled();
    expect(formatSpecialitesResume).not.toHaveBeenCalled();
    expect(computeSortScore).not.toHaveBeenCalled();
  });

  it("starts both entity lookups while medicine loading is still pending", async () => {
    let resolveMedicines!: (rows: []) => void;
    mockExecute.mockResolvedValueOnce([
      { match_type: "substance", group_name: "DRUG", match_label: "Ingredient", sml: 1 },
      { match_type: "indication", group_name: "DRUG", match_label: "Migraine", sml: 0.9 },
    ]).mockReturnValueOnce(new Promise<[]>((resolve) => { resolveMedicines = resolve; }))
      .mockResolvedValueOnce([{ SubsId: "1", NomLib: "Ingredient" }])
      .mockResolvedValueOnce([{ idIndication: 2, nomIndication: "Migraine" }]);
    const loading = getAutocompleteSuggestions("ingredient");
    await vi.waitFor(() => expect(mockExecute).toHaveBeenCalledTimes(4));
    expect(dbMock.selectFrom).toHaveBeenCalledWith("resume_substances");
    expect(dbMock.selectFrom).toHaveBeenCalledWith("resume_indications");
    resolveMedicines([]);
    expect((await loading).map((section) => section.type)).toEqual(["substance", "indication"]);
  });

  it("keeps same-label entities across all categories, with medicine first on a tie", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "name", group_name: "DRUG", match_label: "Migraine", sml: 1 },
      { match_type: "substance", group_name: "DRUG", match_label: "Migraine", sml: 1 },
      { match_type: "indication", group_name: "DRUG", match_label: "Migraine", sml: 1 },
    ]).mockResolvedValueOnce([{ ...makeGroup("DRUG"), specId: "123", specName: "MIGRAINE" }])
      .mockResolvedValueOnce([{ SubsId: "1", NomLib: "Migraine" }])
      .mockResolvedValueOnce([{ idIndication: 2, nomIndication: "Migraine" }]);
    const sections = await getAutocompleteSuggestions("migraine");
    expect(sections.map((section) => section.type)).toEqual(["specialite", "substance", "indication"]);
    expect(sections.flatMap((section) => section.items.map((item) => item.href)))
      .toEqual(["/medicaments/migraine-123", "/substances/migraine-1", "/indications/migraine-2"]);
  });

  it("deduplicates accented and case variants within a category and retains the best score", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "substance", group_name: "DRUG", match_label: "Paracétamol", sml: 1 },
      { match_type: "substance", group_name: "DRUG", match_label: "PARACETAMOL", sml: 0.8 },
    ]).mockResolvedValueOnce([]).mockResolvedValueOnce([{ SubsId: "1", NomLib: "Paracétamol" }]);
    expect((await getAutocompleteSuggestions("para"))[0].items).toEqual([
      { type: "substance", label: "Paracétamol", href: "/substances/paracetamol-1", score: 1 },
    ]);
  });

  it("preserves legacy medicine ranking, formatting, reasons and the five-item limit", async () => {
    const matches = [
      { match_type: "substance" as const, group_name: "DRUG", match_label: "Ingredient", token: "ingredient", spec_id: null, sml: 0.9 },
      { match_type: "name" as const, group_name: "DRUG", match_label: "Alpha", token: "alpha", spec_id: "2", sml: 0.8 },
      { match_type: "atc" as const, group_name: "OTHER", match_label: "Class", token: "class", spec_id: null, sml: 0.6 },
    ];
    // Case variants share a displayed label; old full-search scoring breaks that tie.
    const rows = ["Alpha", "ALPHA", "BETA", "CHARLIE", "DELTA", "ECHO", "FOXTROT"]
      .map((name, index) => ({ ...makeGroup("DRUG", "Ingredient"), specId: String(index + 1), specName: name }));
    rows.push({ ...makeGroup("OTHER", "Ingredient"), specId: "8", specName: "AARDVARK" });
    mockExecute.mockResolvedValueOnce(rows);
    const legacy = await getSearchResultsFromMatches("ingredient", matches);
    const expected = legacy.map((spec) => ({
      type: "specialite", label: formatSpecName(spec.specName), href: `/medicaments/${getSpecSlug(spec.specId, spec.specName)}`,
      matchReasons: spec.matchReasons, score: spec.groupName === "DRUG" ? 0.9 : 0.6,
    })).sort((a, b) => b.score - a.score || a.label.localeCompare(b.label, "fr")).slice(0, 5);

    vi.clearAllMocks();
    mockExecute.mockResolvedValueOnce(matches).mockResolvedValueOnce(rows).mockResolvedValueOnce([]);
    expect((await getAutocompleteSuggestions("ingredient"))[0].items).toEqual(expected);
    expect(getResumeSpecsATCLabels).not.toHaveBeenCalled();
  });

  it("keeps the shared 500-group candidate pool rather than pre-limiting to five groups", async () => {
    mockExecute.mockResolvedValueOnce(Array.from({ length: 501 }, (_, index) => ({
      match_type: "name", group_name: `GROUP${index}`, match_label: `GROUP${index}`, sml: 1 - index / 1000,
    }))).mockResolvedValueOnce([]);
    expect(await getAutocompleteSuggestions("group")).toEqual([]);
    const candidateQuery = dbMock.where.mock.calls.find(([column]) => column === "groupName");
    expect(candidateQuery?.[2]).toHaveLength(500);
    expect(candidateQuery?.[2]).toContain("GROUP499");
    expect(candidateQuery?.[2]).not.toContain("GROUP500");
  });

  it("rejects oversized queries before accessing the database and skips blank queries", async () => {
    await expect(getAutocompleteSuggestions("x".repeat(201))).rejects.toThrow();
    expect(await getAutocompleteSuggestions("  ")).toEqual([]);
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
