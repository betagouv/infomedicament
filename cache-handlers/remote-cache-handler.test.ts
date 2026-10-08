import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CacheEntry, CacheHandler } from "next/cache";

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

// Exercise the actual CommonJS adapter with isolated state and a shared Redis store.
// Vitest's module mocks do not intercept the adapter's require("redis").
function createRedisStore() {
  const values = new Map<string, { value: string; expires?: number }>();
  const get = vi.fn(async (key: string) => {
    const stored = values.get(key);
    return stored && (!stored.expires || stored.expires > Date.now())
      ? stored.value
      : null;
  });
  const set = vi.fn(
    async (key: string, value: string, options?: { EX: number }) => {
      values.set(key, {
        value,
        expires: options ? Date.now() + options.EX * 1000 : undefined,
      });
    },
  );
  const client = {
    on: vi.fn(),
    connect: vi.fn(async () => {}),
    get,
    set,
    mGet: vi.fn(async (keys: string[]) =>
      Promise.all(keys.map((key) => get(key))),
    ),
    multi() {
      const writes: (() => Promise<void>)[] = [];
      const transaction = {
        set(key: string, value: string, options?: { EX: number }) {
          writes.push(() => set(key, value, options));
          return transaction;
        },
        async exec() {
          await Promise.all(writes.map((write) => write()));
        },
      };
      return transaction;
    },
  };
  return client;
}

function loadAdapter(
  redis?: ReturnType<typeof createRedisStore>,
): CacheHandler {
  const adapterModule = { exports: {} };
  runInNewContext(
    readFileSync(require.resolve("./remote-cache-handler.js"), "utf8"),
    {
      module: adapterModule,
      require: (id: string) =>
        id === "redis" ? { createClient: () => redis } : require(id),
      Buffer,
      ReadableStream,
      Date,
      process: { env: redis ? { REDIS_URL: "redis://test" } : {} },
      console: { error: vi.fn() },
    },
  );
  return adapterModule.exports as CacheHandler;
}

function entry(tags: string[] = []): CacheEntry {
  return {
    tags,
    timestamp: Date.now(),
    stale: 300,
    revalidate: 3600,
    expire: 86400,
    value: new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from("payload"));
        controller.close();
      },
    }),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("remote cache lifecycle", () => {
  it("serves independent streams repeatedly across instances until hard expiry", async () => {
    vi.useFakeTimers();
    const redis = createRedisStore();
    const first = loadAdapter(redis);
    const second = loadAdapter(redis);
    await first.set("shared", Promise.resolve(entry()));
    vi.advanceTimersByTime(3601 * 1000);
    for (let read = 0; read < 2; read++) {
      const hit = await second.get("shared", []);
      expect(hit?.revalidate).toBe(3600);
      await expect(__testing.streamToBuffer(hit!.value)).resolves.toEqual(
        Buffer.from("payload"),
      );
    }
    vi.advanceTimersByTime(86400 * 1000);
    await expect(second.get("shared", [])).resolves.toBeUndefined();
  });

  it("waits for an in-flight write before returning a hit", async () => {
    const handler = loadAdapter();
    let complete!: (value: CacheEntry) => void;
    const pending = new Promise<CacheEntry>((resolve) => {
      complete = resolve;
    });
    const write = handler.set("pending", pending);
    let finished = false;
    const read = handler.get("pending", []).then((value) => {
      finished = true;
      return value;
    });
    await Promise.resolve();
    expect(finished).toBe(false);
    complete(entry());
    await write;
    expect(await read).toBeDefined();
  });

  it("treats Redis read errors as misses so pages can render from their source", async () => {
    const redis = createRedisStore();
    redis.get.mockRejectedValue(new Error("Redis offline"));
    await expect(
      loadAdapter(redis).get("missing", []),
    ).resolves.toBeUndefined();
  });

  it("does not fail renders when a Redis write is unavailable", async () => {
    const redis = createRedisStore();
    redis.set.mockRejectedValue(new Error("Redis offline"));
    await expect(
      loadAdapter(redis).set("page", Promise.resolve(entry())),
    ).resolves.toBeUndefined();
  });

  it("treats malformed stored entries as cache misses", async () => {
    const redis = createRedisStore();
    redis.get.mockResolvedValue("invalid JSON");
    await expect(loadAdapter(redis).get("page", [])).resolves.toBeUndefined();
  });

  it("discards interrupted streams and releases waiting readers", async () => {
    const handler = loadAdapter();
    const broken = entry();
    broken.value = new ReadableStream({
      start(controller) {
        controller.enqueue(Buffer.from("partial"));
        controller.error(new Error("render interrupted"));
      },
    });
    const write = handler.set("broken", Promise.resolve(broken));
    const read = handler.get("broken", []);
    await expect(write).resolves.toBeUndefined();
    await expect(read).resolves.toBeUndefined();
  });

  it("never resurrects a tagged entry after the tag expiration duration", async () => {
    vi.useFakeTimers();
    const redis = createRedisStore();
    const first = loadAdapter(redis);
    const second = loadAdapter(redis);
    await first.set("tagged", Promise.resolve(entry(["catalog"])));
    vi.advanceTimersByTime(1000);
    await second.updateTags(["catalog"], { expire: 2 });
    vi.advanceTimersByTime(3000);
    await expect(first.get("tagged", [])).resolves.toBeUndefined();
  });

  it("serves stale tagged data for background refresh before delayed expiration", async () => {
    vi.useFakeTimers();
    const handler = loadAdapter(createRedisStore());
    await handler.set("tagged", Promise.resolve(entry(["catalog"])));
    vi.advanceTimersByTime(1000);
    await handler.updateTags(["catalog"], { expire: 60 });
    const stale = await handler.get("tagged", []);
    expect(stale?.revalidate).toBe(-1);
    vi.advanceTimersByTime(61000);
    await expect(handler.get("tagged", [])).resolves.toBeUndefined();
  });

  it("checks implicit path tags across instances and immediately expires them", async () => {
    vi.useFakeTimers();
    const redis = createRedisStore();
    const first = loadAdapter(redis);
    const second = loadAdapter(redis);
    await first.set("page", Promise.resolve(entry()));
    vi.advanceTimersByTime(1000);
    await second.updateTags(["_N_T_/medicaments"]);
    await expect(
      first.get("page", ["_N_T_/medicaments"]),
    ).resolves.toBeUndefined();
  });
});
