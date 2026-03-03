import { describe, it, expect, vi, beforeEach } from "vitest";

import { getSearchResults, MatchReason } from "./search";
import { computeSortScore } from "./searchScoring";
import { getResumeSpecsGroupsATCLabels } from "./atc";
import { getResumeSpecsGroupsAlerts } from "@/data/grist/specialites";
import { formatSpecialitesResumeFromGroups } from "@/utils/specialites";

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
vi.mock("@/data/grist/specialites");
vi.mock("@/utils/specialites");

// Disable server-only for tests
vi.mock("server-only", () => ({}));

const makeGroup = (groupName: string, composants = "") => ({
  groupName,
  composants,
  specialites: [],
  CISList: [],
  subsIds: [],
  pathosCodes: [],
});

describe("Search Engine (getSearchResults)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Pass-through mocks for enrichment functions
    vi.mocked(formatSpecialitesResumeFromGroups).mockImplementation((groups) =>
      groups.map((g: any) => ({ ...g, resumeSpecialites: [] })),
    );
    vi.mocked(getResumeSpecsGroupsATCLabels).mockImplementation(async (groups) => groups);
    vi.mocked(getResumeSpecsGroupsAlerts).mockImplementation(async (groups) => groups);
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
