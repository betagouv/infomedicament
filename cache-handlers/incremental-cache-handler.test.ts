import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const cacheHandler = require("./incremental-cache-handler.js") as {
  assertRedisCacheAvailable(
    environment: Record<string, string | undefined>,
    createRedisClient: () => {
      on(): void;
      connect(): Promise<void>;
      ping(): Promise<void>;
      readonly isReady: boolean;
      quit(): Promise<void>;
    },
  ): Promise<void>;
  __testing: {
    decode(value: string): unknown;
    encode(value: unknown): string;
    getTtlSeconds(
      data: { revalidate?: number } | null,
      context?: { cacheControl?: { revalidate?: number; expire?: number } },
    ): number;
    shouldUseRedis(environment: Record<string, string | undefined>): boolean;
  };
};
const { assertRedisCacheAvailable } = cacheHandler;
const { decode, encode, getTtlSeconds, shouldUseRedis } =
  cacheHandler.__testing;

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

  it("checks Redis connectivity before startup", async () => {
    let pinged = false;
    let disconnected = false;

    await assertRedisCacheAvailable({ REDIS_URL: "redis://cache" }, () => ({
      on() {},
      async connect() {},
      async ping() {
        pinged = true;
      },
      get isReady() {
        return true;
      },
      async quit() {
        disconnected = true;
      },
    }));

    expect(pinged).toBe(true);
    expect(disconnected).toBe(true);
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
