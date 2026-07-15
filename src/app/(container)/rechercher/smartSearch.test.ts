import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));
vi.mock("@/app/(container)/medicaments/[CIS]/notice-search/answerNoticeQuestion", () => ({ answerNoticeQuestion: vi.fn() }));
vi.mock("@/db/utils", () => ({ getSearchResults: vi.fn() }));
vi.mock("@/db/utils/notice", () => ({ getNotice: vi.fn() }));
vi.mock("./queryAnalysis", () => ({ analyzeQuery: vi.fn() }));

import { buildSmartSearchQuery, hasClearWinner } from "./smartSearch";
import { answerNoticeQuestion } from "@/app/(container)/medicaments/[CIS]/notice-search/answerNoticeQuestion";
import { getSearchResults } from "@/db/utils";
import { analyzeQuery } from "./queryAnalysis";
import { getSmartSearchResponse } from "./smartSearch";

const answerNoticeQuestionMock = vi.mocked(answerNoticeQuestion);
const getSearchResultsMock = vi.mocked(getSearchResults);
const analyzeQueryMock = vi.mocked(analyzeQuery);

describe("buildSmartSearchQuery", () => {
  it("combines extracted medicine search terms", () => {
    expect(buildSmartSearchQuery({
      intent: "specific_medicine_question",
      specialites: ["Doliprane"],
      substances: ["paracétamol"],
      indications: ["fièvre"],
      searchTerms: ["douleur"],
      question: "Quelle dose prendre ?",
    })).toBe("Doliprane");
  });

  it("uses substances when no specialite is present", () => {
    expect(buildSmartSearchQuery({
      intent: "generic_medicine_search",
      specialites: [],
      substances: ["paracétamol"],
      indications: ["fièvre"],
      searchTerms: ["douleur"],
      question: "Quel médicament prendre pour une douleur ?",
    })).toBe("paracétamol");
  });

  it("uses indications when no specialite or substance is present", () => {
    expect(buildSmartSearchQuery({
      intent: "generic_medicine_search",
      specialites: [],
      substances: [],
      indications: ["fièvre"],
      searchTerms: ["douleur"],
      question: "Quel médicament prendre pour la fièvre ?",
    })).toBe("fièvre");
  });

  it("returns an empty query when no medicine clue is present", () => {
    expect(buildSmartSearchQuery({
      intent: "generic_medicine_search",
      specialites: [],
      substances: [],
      indications: [],
      searchTerms: [],
      question: "Bonjour",
    })).toBe("");
  });
});

describe("hasClearWinner", () => {
  it("accepts a single candidate", () => {
    expect(hasClearWinner([{
      specId: "1",
      specName: "A",
      groupName: "A",
      score: 4,
      matchReasons: [],
    }])).toBe(true);
  });

  it("accepts a candidate when the score gap is clear", () => {
    expect(hasClearWinner([
      { specId: "1", specName: "A", groupName: "A", score: 4, matchReasons: [] },
      { specId: "2", specName: "B", groupName: "B", score: 3.1, matchReasons: [] },
    ])).toBe(true);
  });

  it("asks for confirmation when scores are close", () => {
    expect(hasClearWinner([
      { specId: "1", specName: "A", groupName: "A", score: 4, matchReasons: [] },
      { specId: "2", specName: "B", groupName: "B", score: 3.5, matchReasons: [] },
    ])).toBe(false);
  });
});

describe("getSmartSearchResponse", () => {
  it("falls back to deterministic search when query analysis fails", async () => {
    vi.spyOn(console, "error").mockImplementationOnce(() => undefined);
    analyzeQueryMock.mockRejectedValueOnce(new Error("Albert unavailable"));
    getSearchResultsMock.mockResolvedValueOnce([{
      specId: "1",
      specName: "DOLIPRANE 500 mg",
      groupName: "DOLIPRANE",
      score: 4,
      matchReasons: [],
    } as never]);

    await expect(getSmartSearchResponse("Doliprane")).resolves.toMatchObject({
      status: "results",
      searchQuery: "Doliprane",
      extraction: {
        intent: "generic_medicine_search",
        question: "",
      },
      searchResults: [{ specId: "1" }],
      hits: [],
    });
    expect(getSearchResultsMock).toHaveBeenCalledWith("Doliprane");
  });

  it.each([
    ["blocked", "Nous ne pouvons pas aider à se faire du mal"],
    ["urgent_medical_attention", "Cette situation peut nécessiter une prise en charge immédiate"],
  ] as const)("uses the fixed safety message for %s", async (intent, expectedMessage) => {
    analyzeQueryMock.mockResolvedValueOnce({
      intent,
      specialites: [],
      substances: [],
      indications: [],
      searchTerms: [],
      question: "",
      safetyMessage: "Untrusted model-generated message",
    });

    await expect(getSmartSearchResponse("danger")).resolves.toMatchObject({
      status: intent,
      topBlock: {
        message: expect.stringContaining(expectedMessage),
      },
    });
  });

  it("does not search a notice when the extraction has no question", async () => {
    analyzeQueryMock.mockResolvedValueOnce({
      intent: "specific_medicine_question",
      specialites: [],
      substances: ["xanax"],
      indications: [],
      searchTerms: [],
      question: "",
    });
    getSearchResultsMock.mockResolvedValueOnce([{
      specId: "1",
      specName: "XANAX 0,25 mg",
      groupName: "XANAX",
      score: 4,
      matchReasons: [],
    } as never]);

    await expect(getSmartSearchResponse("xanax")).resolves.toMatchObject({
      status: "results",
      searchQuery: "xanax",
      hits: [],
    });
    expect(answerNoticeQuestionMock).not.toHaveBeenCalled();
  });
});
