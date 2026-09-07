import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { decode, encode, getTtlSeconds, shouldUseRedis } =
  require("./cache-handler.js").__testing as {
    decode(value: string): unknown;
    encode(value: unknown): string;
    getTtlSeconds(
      data: { revalidate?: number } | null,
      context?: { cacheControl?: { revalidate?: number; expire?: number } },
    ): number;
    shouldUseRedis(environment: Record<string, string | undefined>): boolean;
  };

describe("Redis cache handler selection", () => {
  it("uses Redis at runtime when a URL is configured", () => {
    expect(shouldUseRedis({ REDIS_URL: "redis://cache" })).toBe(true);
  });

  it("uses Next's local cache when Redis is absent", () => {
    expect(shouldUseRedis({})).toBe(false);
  });

  it("uses Next's local cache while building", () => {
    expect(
      shouldUseRedis({
        NEXT_PHASE: "phase-production-build",
        SCALINGO_REDIS_URL: "redis://cache",
      }),
    ).toBe(false);
  });
});

describe("Redis cache handler serialization", () => {
  it("round-trips the Buffer and Map values used by Next's ISR cache", () => {
    const value = {
      value: {
        kind: "APP_PAGE",
        rscData: Buffer.from("rsc"),
        segmentData: new Map([["/segment", Buffer.from("segment")]]),
      },
      lastModified: 123,
      tags: ["page-tag"],
    };

    expect(decode(encode(value))).toEqual(value);
  });
});

describe("Redis cache handler TTL", () => {
  it("keeps stale entries available beyond their revalidation time", () => {
    expect(getTtlSeconds({ revalidate: 3_600 })).toBe(5_400);
  });

  it("uses Next's explicit expiration when supplied", () => {
    expect(
      getTtlSeconds(null, {
        cacheControl: { revalidate: 3_600, expire: 86_400 },
      }),
    ).toBe(86_400);
  });
});
