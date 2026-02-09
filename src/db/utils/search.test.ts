import { describe, it, expect, vi, beforeEach } from "vitest";

import { getSearchResults } from "./search";
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

const makeGroup = (groupName: string) => ({
  groupName,
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

  it("should sort results by score descending", async () => {
    // First call: search_index query
    mockExecute.mockResolvedValueOnce([
      { match_type: "name", group_name: "DOLIPRANE", match_label: "DOLIPRANE 1000 mg", token: "doliprane 1000 mg", sml: 0.9 },
      { match_type: "substance", group_name: "EFFERALGAN", match_label: "PARACETAMOL", token: "paracetamol", sml: 0.3 },
    ]);
    // Second call: resume_medicaments query
    mockExecute.mockResolvedValueOnce([makeGroup("DOLIPRANE"), makeGroup("EFFERALGAN")]);

    const results = await getSearchResults("Doliprane");

    expect(results).toHaveLength(2);
    expect(results[0].groupName).toBe("DOLIPRANE");
    expect(results[1].groupName).toBe("EFFERALGAN");
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
