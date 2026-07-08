import { describe, it, expect, vi, beforeEach } from "vitest";

import { getAutocompleteSuggestions } from "./autocomplete";
import { getSynonymMap } from "./searchSynonyms";
import { getResumeSpecsATCLabels } from "./atc";
import { formatSpecialitesResume } from "@/utils/specialites";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

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
vi.mock("@/db/pdbmMySQL", () => ({ pdbmMySQL: {} }));
vi.mock("@/data/grist/specialites");
vi.mock("@/utils/specialites");

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
      { NomId: "123", NomLib: "Paracétamol" },
    ]);

    const sections = await getAutocompleteSuggestions("paracetamol");

    const substanceSection = sections.find((section) => section.type === "substance");
    const medicineSection = sections.find((section) => section.type === "specialite");

    expect(substanceSection?.items[0]).toMatchObject({
      label: "Paracétamol",
      href: "/substances/123",
    });
    expect(medicineSection?.items[0]).toMatchObject({
      href: "/medicaments/61234567",
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
      { NomId: "123", NomLib: "Paracétamol" },
    ]);

    const sections = await getAutocompleteSuggestions("paracetamol");

    const medicineSection = sections.find((section) => section.type === "specialite");

    expect(medicineSection?.items.map((item) => item.href)).toContain("/medicaments/70000001");
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

    expect(indicationSection?.items[0].href).toBe("/indications/42");
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
});
