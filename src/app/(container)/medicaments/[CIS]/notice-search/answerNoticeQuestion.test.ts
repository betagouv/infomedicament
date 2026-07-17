import { describe, expect, it, vi } from "vitest";

const { unstableCacheMock } = vi.hoisted(() => ({
  unstableCacheMock: vi.fn((callback: () => unknown) => callback),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: unstableCacheMock }));
vi.mock("@/lib/albert", () => ({
  CHAT_MODEL: "test-model",
  createAlbertChatCompletion: vi.fn(),
}));

import { createAlbertChatCompletion } from "@/lib/albert";
import { answerNoticeQuestion, getCachedNoticeQuestionAnswer } from "./answerNoticeQuestion";

const createAlbertChatCompletionMock = vi.mocked(createAlbertChatCompletion);

describe("answerNoticeQuestion", () => {
  it("forces a tool call and parses tool arguments with zod", async () => {
    createAlbertChatCompletionMock.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            function: {
              arguments: JSON.stringify({
                answer: "Ne prenez jamais ce médicament.",
                section_anchor: "Ann3bNePrenezJamais",
                sub_header: "Ne prenez jamais",
                block_id: "[block-42]",
                quote: "Ne prenez jamais ce médicament.",
              }),
            },
          }],
        },
      }],
    });

    const result = await answerNoticeQuestion("Notice : [block-42] Ne prenez jamais ce médicament.", "Puis-je le prendre ?");
    const requestBody = createAlbertChatCompletionMock.mock.calls[0][0] as {
      tools: Array<{ function: { name: string } }>;
      tool_choice: { function: { name: string } };
      response_format?: unknown;
    };

    expect(requestBody.tools[0].function.name).toBe("answer_notice_question");
    expect(requestBody.tool_choice.function.name).toBe("answer_notice_question");
    expect(requestBody.response_format).toBeUndefined();
    expect(result).toEqual({
      answer: "Ne prenez jamais ce médicament.",
      section_anchor: "Ann3bNePrenezJamais",
      sub_header: "Ne prenez jamais",
      block_id: "[block-42]",
      quote: "Ne prenez jamais ce médicament.",
    });
  });

  it("fails when Albert does not return tool-call arguments", async () => {
    createAlbertChatCompletionMock.mockResolvedValueOnce({
      choices: [{
        message: {
          content: "{}",
        },
      }],
    });

    await expect(answerNoticeQuestion("Notice", "Question")).rejects.toThrow("tool arguments");
  });

  it("caches notice answers by medicine and question for 24 hours", async () => {
    createAlbertChatCompletionMock.mockResolvedValueOnce({
      choices: [{
        message: {
          tool_calls: [{
            function: {
              arguments: JSON.stringify({
                answer: "Réponse",
                section_anchor: "section",
                sub_header: "",
                block_id: "block-1",
                quote: "Réponse",
              }),
            },
          }],
        },
      }],
    });

    await getCachedNoticeQuestionAnswer("123", "Question", "Notice");

    expect(unstableCacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ["notice-search", "123", "Question"],
      { revalidate: 60 * 60 * 24 },
    );
  });
});
