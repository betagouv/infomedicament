import { afterEach, describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("server-only", () => ({}));

import { parseAlbertJson, selectNoticePassages } from "./albert";
import {
  getSelectableNoticeQuotes,
  noticeSelectionJsonSchema,
  prepareNoticePassages,
  resolveNoticeSelection,
} from "./noticePassages";

afterEach(() => vi.restoreAllMocks());

describe("schema-constrained selection", () => {
  it("allows the 1,682-token pregnancy selection that exceeded the old output budget", async () => {
    const selection = {
      status: "supported",
      selections: [
        {
          passage_id: "passage-5",
          quote_ids: Array.from(
            { length: 148 },
            (_, index) => `passage-5-quote-${index + 17}`,
          ),
        },
      ],
    };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      const request = JSON.parse(init!.body as string);
      // The live CIS 67623734 response required 1,682 completion tokens.
      const truncated = request.max_tokens < 1682;
      return new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: truncated ? "length" : "stop",
              message: { content: JSON.stringify(selection) },
            },
          ],
        }),
      );
    });
    const passages = [
      {
        id: "passage-5",
        html: "",
        headingPath: [],
        target: {},
        quotes: selection.selections[0].quote_ids.map((id, index) => ({
          id,
          html: `<p>Condition ${index}.</p>`,
          headingPath: [],
        })),
      },
    ];
    expect(
      await selectNoticePassages(passages, "Grossesse et allaitement"),
    ).toEqual(selection);
  });

  it("reviews a draft using only the retrieved source candidates", async () => {
    const { passages } = prepareNoticePassages(
      "<h2>Précautions</h2><p>Condition essentielle.</p><p>Information hors sujet.</p><p>Non retenue initialement.</p>",
    );
    const draft = {
      status: "supported",
      selections: [
        {
          passage_id: "passage-1",
          quote_ids: ["passage-1-quote-1", "passage-1-quote-2"],
        },
      ],
    };
    const reviewed = {
      status: "supported",
      selections: [
        { passage_id: "passage-1", quote_ids: ["passage-1-quote-1"] },
      ],
    };
    const response = (selection: unknown) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify(selection) },
            },
          ],
        }),
      );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(draft))
      .mockResolvedValueOnce(response(reviewed));
    expect(await selectNoticePassages(passages, "Question")).toEqual(reviewed);
    const reviewRequest = JSON.parse(
      fetchMock.mock.calls[1][1]!.body as string,
    );
    const input = JSON.parse(reviewRequest.messages[1].content);
    expect(
      input.passages[0].quotes.map((quote: { id: string }) => quote.id),
    ).toEqual(draft.selections[0].quote_ids);
    expect(input.passages[0].quotes[0].html).toBe(
      "<p>Condition essentielle.</p>",
    );
    expect(reviewRequest.response_format.json_schema.schema).toEqual(
      noticeSelectionJsonSchema,
    );
  });

  it("rejects a review that introduces a quote outside the retrieved candidates", async () => {
    const { passages } = prepareNoticePassages(
      "<h2>Précautions</h2><p>Condition.</p><p>Autre information.</p>",
    );
    const response = (quoteId: string) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: {
                content: JSON.stringify({
                  status: "supported",
                  selections: [
                    { passage_id: "passage-1", quote_ids: [quoteId] },
                  ],
                }),
              },
            },
          ],
        }),
      );
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response("passage-1-quote-1"))
      .mockResolvedValueOnce(response("passage-1-quote-2"));
    await expect(selectNoticePassages(passages, "Question")).rejects.toThrow(
      "Unknown notice quote",
    );
  });

  it("abstains when the review cannot retain a supported answer instead of showing the draft", async () => {
    const { passages } = prepareNoticePassages(
      "<h2>Précautions</h2><p>Condition.</p>",
    );
    const response = (value: unknown) =>
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify(value) },
            },
          ],
        }),
      );
    const insufficient = { status: "insufficient_evidence", selections: [] };
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        response({
          status: "supported",
          selections: [
            { passage_id: "passage-1", quote_ids: ["passage-1-quote-1"] },
          ],
        }),
      )
      .mockResolvedValueOnce(response(insufficient));
    expect(await selectNoticePassages(passages, "Question")).toEqual(
      insufficient,
    );
  });

  it("rejects a truncated selection even when its JSON is complete", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "length",
              message: {
                content: '{"status":"insufficient_evidence","selections":[]}',
              },
            },
          ],
        }),
      ),
    );
    await expect(
      selectNoticePassages([], "Grossesse et allaitement"),
    ).rejects.toThrow(/truncated/);
  });

  it.each(["60234100", "64720167"])(
    "sends deduplicated readable quotes without losing source content or context for CIS %s",
    async (cis) => {
      const html = readFileSync(
        `src/testsUtils/fixtures/notice-${cis}.html`,
        "utf8",
      );
      const { passages } = prepareNoticePassages(html);
      const passage = passages.find((item) => item.quotes.length)!;
      const quote = getSelectableNoticeQuotes(passage)[0];
      const selection = {
        status: "supported",
        selections: [{ passage_id: passage.id, quote_ids: [quote.id] }],
      };
      const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              choices: [
                {
                  finish_reason: "stop",
                  message: { content: JSON.stringify(selection) },
                },
              ],
            }),
          ),
      );
      const result = await selectNoticePassages(passages, "Question de test");
      const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
      const input = JSON.parse(request.messages[1].content);
      const sent = new Map<string, { html: string; headingPath: string[] }>();
      const seenContent = new Set<string>();
      for (const compact of input.passages) {
        const source = passages.find((item) => item.id === compact.id)!;
        expect(compact.html).toBeUndefined();
        expect(compact.headingPath).toEqual(source.headingPath);
        for (const quote of compact.quotes) {
          const sourceQuote = getSelectableNoticeQuotes(source).find(
            (item) => item.id === quote.id,
          )!;
          const headingPath = quote.headingPath ?? compact.headingPath;
          expect(quote.html).toBe(sourceQuote.html);
          expect(headingPath).toEqual(sourceQuote.headingPath);
          const key = JSON.stringify([headingPath, quote.html]);
          expect(seenContent.has(key)).toBe(false);
          seenContent.add(key);
          sent.set(key, { html: quote.html, headingPath });
        }
      }
      // Deduplication must not remove any distinct source text or its context.
      for (const source of passages) {
        for (const quote of getSelectableNoticeQuotes(source)) {
          expect(
            sent.has(JSON.stringify([quote.headingPath, quote.html])),
          ).toBe(true);
        }
      }
      expect(resolveNoticeSelection(passages, result)[0].quotes[0].html).toBe(
        quote.html,
      );
      const previousInput = {
        question: "Question de test",
        passages: passages.map((source) => ({
          id: source.id,
          headingPath: source.headingPath,
          html: source.html,
          quotes: getSelectableNoticeQuotes(source).map(
            ({ id, html, headingPath }) => ({ id, html, headingPath }),
          ),
        })),
      };
      expect(request.messages[1].content.length).toBeLessThan(
        JSON.stringify(previousInput).length / 2,
      );
    },
  );

  it("sends the server's selection schema as a strict structured-output response format", async () => {
    const selection = { status: "insufficient_evidence", selections: [] };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify(selection) },
            },
          ],
        }),
      ),
    );
    expect(await selectNoticePassages([], "Question de test")).toEqual(
      selection,
    );
    const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(request.response_format).toEqual({
      type: "json_schema",
      json_schema: {
        name: "notice_selection",
        strict: true,
        schema: noticeSelectionJsonSchema,
      },
    });
    expect(noticeSelectionJsonSchema.oneOf).toHaveLength(2);
  });
});

const PAYLOAD = {
  answer: "Twice daily.",
  section_anchor: "Ann3b",
  block_id: "block-123",
};

describe("parseAlbertJson", () => {
  it("parses raw JSON", () => {
    expect(parseAlbertJson(JSON.stringify(PAYLOAD))).toEqual(PAYLOAD);
  });

  it("parses ```json fenced output", () => {
    expect(
      parseAlbertJson("```json\n" + JSON.stringify(PAYLOAD) + "\n```"),
    ).toEqual(PAYLOAD);
  });

  it("parses plain ``` fenced output", () => {
    expect(
      parseAlbertJson("```\n" + JSON.stringify(PAYLOAD) + "\n```"),
    ).toEqual(PAYLOAD);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseAlbertJson("not json")).toThrow();
  });
});
