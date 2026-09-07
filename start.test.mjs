import { describe, expect, it } from "vitest";
import { assertRedisCacheAvailable, getRedisCacheUrl } from "./start.mjs";

describe("Redis cache startup selection", () => {
  it("prefers Scalingo's canonical Redis URL", () => {
    expect(
      getRedisCacheUrl({
        SCALINGO_REDIS_URL: "redis://scalingo",
        REDIS_URL: "redis://alias",
      }),
    ).toBe("redis://scalingo");
  });

  it("uses REDIS_URL outside Scalingo", () => {
    expect(getRedisCacheUrl({ REDIS_URL: "redis://generic" })).toBe(
      "redis://generic",
    );
  });

  it("uses local caching without opening a Redis connection", async () => {
    await expect(assertRedisCacheAvailable({})).resolves.toBeUndefined();
  });
});
