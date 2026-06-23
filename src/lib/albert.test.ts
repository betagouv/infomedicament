import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseAlbertJson } from "./albert";

const PAYLOAD = { answer: "Twice daily.", section_anchor: "Ann3b", block_id: "block-123" };

describe("parseAlbertJson", () => {
  it("parses raw JSON", () => {
    expect(parseAlbertJson(JSON.stringify(PAYLOAD))).toEqual(PAYLOAD);
  });

  it("parses ```json fenced output", () => {
    expect(parseAlbertJson("```json\n" + JSON.stringify(PAYLOAD) + "\n```")).toEqual(PAYLOAD);
  });

  it("parses plain ``` fenced output", () => {
    expect(parseAlbertJson("```\n" + JSON.stringify(PAYLOAD) + "\n```")).toEqual(PAYLOAD);
  });

  it("throws on invalid JSON", () => {
    expect(() => parseAlbertJson("not json")).toThrow();
  });
});
