import { afterEach, describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseAlbertJson, selectNoticePassages } from "./albert";
import { noticeSelectionJsonSchema } from "./noticePassages";

afterEach(() => vi.restoreAllMocks());

describe("schema-constrained selection", () => {
  it("sends the server's selection schema as a strict structured-output response format", async () => {
    const selection = { status: "insufficient_evidence", selections: [] };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify(selection) } }],
    })));
    expect(await selectNoticePassages([], "Question de test")).toEqual(selection);
    const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(request.response_format).toEqual({
      type: "json_schema",
      json_schema: { name: "notice_selection", strict: true, schema: noticeSelectionJsonSchema },
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
