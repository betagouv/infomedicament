import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: vi.fn() } }));
vi.mock("./answerNoticeQuestion", () => ({ answerNoticeQuestion: vi.fn() }));
vi.mock("@/db/utils/notice", () => ({ getNotice: vi.fn() }));

import { extractBlockId } from "./route";

describe("extractBlockId", () => {
  it("handles [block-12345] format", () => {
    expect(extractBlockId("[block-12345]")).toBe("12345");
  });

  it("handles block-12345 format", () => {
    expect(extractBlockId("block-12345")).toBe("12345");
  });

  it("handles plain numeric string", () => {
    expect(extractBlockId("12345")).toBe("12345");
  });

  it("returns undefined for empty string", () => {
    expect(extractBlockId("")).toBeUndefined();
  });
});
