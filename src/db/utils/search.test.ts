import { describe, it, expect, vi, beforeEach } from "vitest";

import { getSearchResults } from "./search";
import { getSubstancesResume } from "./substances";
import { getPathologiesResume } from "./pathologies";
import { getResumeSpecsGroupsWithCISSubsIds } from "./specialities";
import { getResumeSpecsGroupsATCLabels } from "./atc";
import { getResumeSpecsGroupsAlerts } from "@/data/grist/specialites";

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

// auto-mocking data fetching modules and their functions
vi.mock("./substances");
vi.mock("./pathologies");
vi.mock("./specialities");
vi.mock("./atc");
vi.mock("@/data/grist/specialites");

// Disable server-only for tests
vi.mock("server-only", () => ({}));

describe("Legacy Search Engine (getSearchResults)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default setup for data fetching functions to return empty arrays
    vi.mocked(getResumeSpecsGroupsWithCISSubsIds).mockResolvedValue([]);
    vi.mocked(getResumeSpecsGroupsATCLabels).mockResolvedValue([]);
    vi.mocked(getResumeSpecsGroupsAlerts).mockResolvedValue([]);
    vi.mocked(getSubstancesResume).mockResolvedValue([]);
    vi.mocked(getPathologiesResume).mockResolvedValue([]);
  });

  it("should return an empty array if the DB finds nothing", async () => {
    mockExecute.mockResolvedValue([]);

    const results = await getSearchResults("foobar");
    expect(results).toEqual([]);
  });

  it("should find and format a Specialite (e.g., Doliprane 1000mg)", async () => {
    // TODO: add unit tests for specialites (this is hell right now because of all the dependencies
    expect(true).toBe(true);
  });

  it("should sort results by score", async () => {
    mockExecute.mockResolvedValue([
      {
        id: "PATHO_1",
        table_name: "Patho",
        token: "Grippe B",
        sml: 0.3,
      },
      {
        id: "SUB_1",
        table_name: "Subs_Nom",
        token: "Grippe",
        sml: 0.9,
      },
      {
        id: "PATHO_2",
        table_name: "Patho",
        token: "Grippe A",
        sml: 0.5,
      },
    ]);

    (getSubstancesResume as any).mockResolvedValue([
      { NomId: "SUB_1", NomLib: "Virus Grippe" },
    ]);
    (getPathologiesResume as any).mockResolvedValue([
      { codePatho: "PATHO_1", NomPatho: "Grippe B (H2N2)" },
      { codePatho: "PATHO_2", NomPatho: "Grippe A (H1N1)" },
    ]);

    const results = await getSearchResults("Grippe");

    expect(results).toHaveLength(3);
    // Check order by score
    expect((results[0] as any).NomLib).toBe("Virus Grippe");
    expect((results[1] as any).NomPatho).toBe("Grippe A (H1N1)");
    expect((results[2] as any).NomPatho).toBe("Grippe B (H2N2)");
  });
});
