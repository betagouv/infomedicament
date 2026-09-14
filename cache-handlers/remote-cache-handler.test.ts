import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { __testing } = require("./remote-cache-handler.js") as {
  __testing: {
    deserializeEntry(stored: string): {
      value: ReadableStream<Uint8Array>;
      tags: string[];
      timestamp: number;
      expire: number;
      revalidate: number;
      stale: number;
    };
    getTtlSeconds(entry: { expire: number }): number;
    serializeEntry(entry: Record<string, unknown>, value: Buffer): string;
    shouldUseRedis(environment: Record<string, string | undefined>): boolean;
    streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer>;
  };
};

describe("remote use-cache handler", () => {
  it("uses Redis only at runtime when a URL is configured", () => {
    expect(__testing.shouldUseRedis({ REDIS_URL: "redis://cache" })).toBe(true);
    expect(__testing.shouldUseRedis({})).toBe(false);
    expect(
      __testing.shouldUseRedis({
        NEXT_PHASE: "phase-production-build",
        REDIS_URL: "redis://cache",
      }),
    ).toBe(false);
  });

  it("round-trips cache entry streams", async () => {
    const entry = {
      tags: ["medicaments"],
      stale: 300,
      timestamp: 123,
      expire: 86_400,
      revalidate: 3_600,
    };

    const restored = __testing.deserializeEntry(
      __testing.serializeEntry(entry, Buffer.from("cached payload")),
    );

    expect({ ...restored, value: undefined }).toEqual({
      ...entry,
      value: undefined,
    });
    await expect(__testing.streamToBuffer(restored.value)).resolves.toEqual(
      Buffer.from("cached payload"),
    );
  });

  it("uses explicit expiry for Redis TTLs", () => {
    expect(__testing.getTtlSeconds({ expire: 86_400 })).toBe(86_400);
    expect(__testing.getTtlSeconds({ expire: Number.POSITIVE_INFINITY })).toBe(
      365 * 24 * 60 * 60,
    );
  });
});
