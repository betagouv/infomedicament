import { describe, it, expect, vi, beforeEach } from "vitest";

import { getSearchResults } from "./search";
import { computeSortScore } from "./searchScoring";
import { getSynonymMap } from "./searchSynonyms";
import { getResumeSpecsATCLabels } from "./atc";
import { formatSpecialitesResume } from "@/utils/specialites";
import { MatchReason } from "@/types/SearchTypes";

// Mocking the cache so it doesn't apply
vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

// Mocking Kysely
const { dbMock, mockExecute } = vi.hoisted(() => {
  const execute = vi.fn();

  const mockDbInstance = {
    selectFrom: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: execute,
  };

  return {
    dbMock: mockDbInstance,
    mockExecute: execute,
  };
});

// Mocking the DB module to use the mock DB instance
vi.mock("@/db", () => ({
  default: dbMock,
}));

vi.mock("./atc");
vi.mock("@/db/pdbmMySQL", () => ({ pdbmMySQL: {} }));
vi.mock("@/data/grist/specialites");
vi.mock("@/utils/specialites");

// Keep the real (pure) expandQuery; stub getSynonymMap so it doesn't hit the DB
// and doesn't consume a mockExecute value meant for the search_index/resume queries.
vi.mock("./searchSynonyms", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./searchSynonyms")>();
  return { ...actual, getSynonymMap: vi.fn() };
});

// Disable server-only for tests
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

describe("Search Engine (getSearchResults)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(formatSpecialitesResume).mockImplementation((spec) =>
      spec.map((g: any) => ({ ...g, indicationsDetails: [] })),
    );
    vi.mocked(getResumeSpecsATCLabels).mockImplementation(async (spec) => spec);
    vi.mocked(getSynonymMap).mockResolvedValue([]);
  });

  it("should return an empty array if the DB finds nothing", async () => {
    mockExecute.mockResolvedValue([]);

    const results = await getSearchResults("foobar");
    expect(results).toEqual([]);
  });

  it("should sort results by score descending if they are from identical match types", async () => {
    // First call: search_index query
    mockExecute.mockResolvedValueOnce([
      { match_type: "name", group_name: "DOLIPRANE", match_label: "DOLIPRANE 1000 mg", token: "doliprane 1000 mg", sml: 0.9 },
      { match_type: "name", group_name: "DOLOPRANOL", match_label: "DOLOPRANOL 1200 mg", token: "dolopranol 1200 mg", sml: 0.3 },
    ]);
    // Second call: resume_medicaments query
    mockExecute.mockResolvedValueOnce([makeGroup("DOLIPRANE"), makeGroup("DOLOPRANOL")]);

    const results = await getSearchResults("Doliprane");

    expect(results).toHaveLength(2);
    expect(results[0].groupName).toBe("DOLIPRANE");
    expect(results[1].groupName).toBe("DOLOPRANOL");
  });

  it("should attach matchReasons to results", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "substance", group_name: "DOLIPRANE", match_label: "PARACETAMOL", token: "paracetamol", sml: 0.8 },
    ]);
    mockExecute.mockResolvedValueOnce([makeGroup("DOLIPRANE")]);

    const results = await getSearchResults("Paracetamol");

    expect(results).toHaveLength(1);
    expect(results[0].matchReasons).toEqual([{ type: "substance", label: "PARACETAMOL" }]);
  });

  it("should group multiple matches for the same group_name and keep best score", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "name", group_name: "DOLIPRANE", match_label: "DOLIPRANE 1000 mg", token: "doliprane 1000 mg", sml: 0.7 },
      { match_type: "substance", group_name: "DOLIPRANE", match_label: "PARACETAMOL", token: "paracetamol", sml: 0.9 },
    ]);
    mockExecute.mockResolvedValueOnce([makeGroup("DOLIPRANE")]);

    const results = await getSearchResults("Doliprane");

    expect(results).toHaveLength(1);
    expect(results[0].groupName).toBe("DOLIPRANE");
    expect(results[0].matchReasons).toEqual([
      { type: "name", label: "DOLIPRANE 1000 mg" },
      { type: "substance", label: "PARACETAMOL" },
    ]);
  });

  it("should rank name matches above substance matches even at equal sml", async () => {
    // Both have sml=1, but "PARACETAMOL MEDICAMENTEUX" is a name match and should rank first
    mockExecute.mockResolvedValueOnce([
      { match_type: "substance", group_name: "DOLIPRANE", match_label: "paracétamol", token: "paracetamol", sml: 1 },
      { match_type: "name", group_name: "PARACETAMOL MEDICAMENTEUX", match_label: "PARACETAMOL MEDICAMENTEUX", token: "paracetamol medicamenteux", sml: 1 },
    ]);
    mockExecute.mockResolvedValueOnce([
      { ...makeGroup("DOLIPRANE"), composants: "paracétamol" },
      { ...makeGroup("PARACETAMOL MEDICAMENTEUX"), composants: "paracétamol" },
    ]);

    const results = await getSearchResults("paracetamol");

    expect(results).toHaveLength(2);
    expect(results[0].groupName).toBe("PARACETAMOL MEDICAMENTEUX");
    expect(results[1].groupName).toBe("DOLIPRANE");
  });

  it("should deduplicate identical match reasons (e.g. multiple subsIds for same substance)", async () => {
    mockExecute.mockResolvedValueOnce([
      { match_type: "substance", group_name: "ACTIFED RHUME", match_label: "paracétamol", token: "paracetamol", sml: 0.9 },
      { match_type: "substance", group_name: "ACTIFED RHUME", match_label: "paracétamol", token: "paracetamol", sml: 0.8 },
    ]);
    mockExecute.mockResolvedValueOnce([makeGroup("ACTIFED RHUME")]);

    const results = await getSearchResults("paracetamol");

    expect(results).toHaveLength(1);
    expect(results[0].matchReasons).toEqual([{ type: "substance", label: "paracétamol" }]);
  });
});

describe("computeSortScore", () => {
  const nameReason = (): MatchReason => ({ type: "name", label: "DOLIPRANE" });
  const substReason = (): MatchReason => ({ type: "substance", label: "paracétamol" });
  const atcReason = (): MatchReason => ({ type: "atc", label: "analgesiques" });

  it("name starts with query > name contained (but not at start)", () => {
    const scoreStart = computeSortScore("doli", "DOLIPRANE", "paracétamol", [nameReason()], 0.9);
    const scoreContained = computeSortScore("doli", "ENDOLIPRANE", "paracétamol", [nameReason()], 0.9);
    expect(scoreStart).toBeGreaterThan(scoreContained);
  });

  it("name match > substance match, even when sml is lower", () => {
    const nameScore = computeSortScore("para", "PARACETAMOL", "paracétamol", [nameReason()], 0.7);
    const substScore = computeSortScore("para", "DOLIPRANE", "paracétamol", [substReason()], 0.9);
    expect(nameScore).toBeGreaterThan(substScore);
  });

  it("single substance > multi-substance substance match", () => {
    const single = computeSortScore("para", "DOLIPRANE", "paracétamol", [substReason()], 0.8);
    const multi = computeSortScore("para", "COMBO DRUG", "paracétamol, ibuprofène", [substReason()], 0.8);
    expect(single).toBeGreaterThan(multi);
  });

  it("multi-substance starting with query > multi-substance containing query elsewhere", () => {
    const start = computeSortScore("para", "DRUG A", "paracétamol, ibuprofène", [substReason()], 0.8);
    const contained = computeSortScore("para", "DRUG B", "ibuprofène, paracétamol", [substReason()], 0.8);
    expect(start).toBeGreaterThan(contained);
  });

  it("substance match > ATC match, even when sml is lower", () => {
    const substScore = computeSortScore("para", "DRUG A", "paracétamol", [substReason()], 0.5);
    const atcScore = computeSortScore("para", "DRUG B", "ibuprofen", [atcReason()], 0.9);
    expect(substScore).toBeGreaterThan(atcScore);
  });

  it("within same tier, higher sml scores higher", () => {
    const high = computeSortScore("doli", "DOLIPRANE", "paracétamol", [nameReason()], 0.9);
    const low = computeSortScore("doli", "DOLIPRANE", "paracétamol", [nameReason()], 0.5);
    expect(high).toBeGreaterThan(low);
  });
});

describe("Search Engine (per-spécialité ranking)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(formatSpecialitesResume).mockImplementation((spec) =>
      spec.map((g: any) => ({ ...g, indicationsDetails: [] })),
    );
    vi.mocked(getResumeSpecsATCLabels).mockImplementation(async (spec) => spec);
    vi.mocked(getSynonymMap).mockResolvedValue([]);
  });

  it("ranks the variant whose name best matches the query above its siblings", async () => {
    // Name tokens of two variants in the same group, attributed to their spec_id
    mockExecute.mockResolvedValueOnce([
      { match_type: "name", group_name: "DOLIPRANE", match_label: "DOLIPRANE 1000 mg", token: "doliprane 1000 mg", spec_id: "CIS1000", sml: 0.95 },
      { match_type: "name", group_name: "DOLIPRANE", match_label: "DOLIPRANE 500 mg", token: "doliprane 500 mg", spec_id: "CIS500", sml: 0.6 },
    ]);
    // resume_specialites returns one row per spécialité
    mockExecute.mockResolvedValueOnce([
      { ...makeGroup("DOLIPRANE"), specId: "CIS1000", specName: "DOLIPRANE 1000 mg" },
      { ...makeGroup("DOLIPRANE"), specId: "CIS500", specName: "DOLIPRANE 500 mg" },
    ]);

    const results = await getSearchResults("doliprane 1000");

    expect(results).toHaveLength(2);
    expect(results[0].specId).toBe("CIS1000");
    expect(results[1].specId).toBe("CIS500");
  });
});

describe("Search Engine (synonyms)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(formatSpecialitesResume).mockImplementation((spec) =>
      spec.map((g: any) => ({ ...g, indicationsDetails: [] })),
    );
    vi.mocked(getResumeSpecsATCLabels).mockImplementation(async (spec) => spec);
  });

  it("expands a lay-term query to its canonical medical term and surfaces the indicated group", async () => {
    vi.mocked(getSynonymMap).mockResolvedValue([
      { id: 0, alias: "mal de tete", canonical: "céphalées" },
    ]);
    // The canonical term ("céphalées") hits an indication token in the index; the
    // existing pipeline attaches the real, accented indication name as the match reason.
    mockExecute.mockResolvedValueOnce([
      { match_type: "indication", group_name: "DOLIPRANE", match_label: "Céphalées", token: "cephalees", spec_id: null, sml: 0.9 },
    ]);
    mockExecute.mockResolvedValueOnce([makeGroup("DOLIPRANE")]);

    const results = await getSearchResults("mal de tête");

    expect(getSynonymMap).toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].groupName).toBe("DOLIPRANE");
    expect(results[0].matchReasons).toEqual([{ type: "indication", label: "Céphalées" }]);
  });
});
