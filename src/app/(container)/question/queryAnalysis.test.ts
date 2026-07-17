import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/albert", () => ({
  createAlbertChatCompletion: vi.fn(),
}));

import { createAlbertChatCompletion } from "@/lib/albert";
import { analyzeQuery } from "./queryAnalysis";

const createAlbertChatCompletionMock = vi.mocked(createAlbertChatCompletion);

describe("question query analysis", () => {
  it("parses strict tool-call arguments with zod", async () => {
    createAlbertChatCompletionMock.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            function: {
              arguments: JSON.stringify({
                intent: "specific_medicine_question",
                specialites: [" Xanax "],
                substances: [],
                indications: [],
                searchTerms: [" alcool "],
                question: " Peut-on prendre de l'alcool avec Xanax ? ",
                safetyMessage: "",
              }),
            },
          }],
        },
      }],
    });

    await expect(analyzeQuery("alcool xanax")).resolves.toEqual({
      intent: "specific_medicine_question",
      specialites: ["Xanax"],
      substances: [],
      indications: [],
      searchTerms: ["alcool"],
      question: "Peut-on prendre de l'alcool avec Xanax ?",
      safetyMessage: undefined,
    });
  });

  it("keeps question empty for a medicine-only search", async () => {
    createAlbertChatCompletionMock.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            function: {
              arguments: JSON.stringify({
                intent: "generic_medicine_search",
                specialites: [],
                substances: [" paracétamol "],
                indications: [],
                searchTerms: [],
                question: " ",
                safetyMessage: "",
              }),
            },
          }],
        },
      }],
    });

    await expect(analyzeQuery("paracétamol")).resolves.toEqual({
      intent: "generic_medicine_search",
      specialites: [],
      substances: ["paracétamol"],
      indications: [],
      searchTerms: [],
      question: "",
      safetyMessage: undefined,
    });
  });

  it("fails when Albert does not return tool-call arguments", async () => {
    createAlbertChatCompletionMock.mockResolvedValueOnce({
      choices: [{
        message: {
          content: JSON.stringify({
            intent: "generic_medicine_search",
            specialites: [],
            substances: [],
            indications: ["fièvre"],
            searchTerms: [],
            question: "fièvre",
            safetyMessage: "",
          }),
        },
      }],
    });

    await expect(analyzeQuery("fièvre")).rejects.toThrow("tool arguments");
  });
});
