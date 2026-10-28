import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

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

function loadAdapter(
  client: object = {
    on() {},
    async connect() {},
    async get() {
      throw new Error("Redis offline");
    },
    multi() {
      throw new Error("Redis offline");
    },
  },
) {
  const adapterModule = { exports: {} };
  runInNewContext(
    readFileSync(require.resolve("./incremental-cache-handler.js"), "utf8"),
    {
      module: adapterModule,
      require: (id: string) =>
        id === "redis"
          ? {
              createClient: () => client,
            }
          : require(id),
      Buffer,
      Date,
      process: { env: { REDIS_URL: "redis://test" } },
      console: { error: vi.fn() },
    },
  );
  const Handler = adapterModule.exports as new (context: object) => {
    get(key: string, context?: { softTags?: string[] }): Promise<unknown>;
    set(key: string, value: unknown): Promise<void>;
    revalidateTag(
      tags: string[],
      durations?: { expire?: number },
    ): Promise<void>;
  };
  return new Handler({});
}

describe("incremental cache availability", () => {
  it("treats runtime Redis read failures as cache misses", async () => {
    await expect(loadAdapter().get("page")).resolves.toBeNull();
  });

  it("does not fail page generation when Redis cannot store the result", async () => {
    await expect(loadAdapter().set("page", null)).resolves.toBeUndefined();
  });
});

function createSharedStore() {
  const values = new Map<string, string>();
  const indexes = new Map<string, Set<string>>();
  return {
    on() {},
    async connect() {},
    async get(key: string) {
      return values.get(key) ?? null;
    },
    async mGet(keys: string[]) {
      return keys.map((key) => values.get(key) ?? null);
    },
    async sMembers(key: string) {
      return [...(indexes.get(key) ?? [])];
    },
    multi() {
      const writes: (() => void)[] = [];
      const transaction = {
        set(key: string, value: string) {
          writes.push(() => {
            values.set(key, value);
          });
          return transaction;
        },
        sAdd(key: string, value: string) {
          writes.push(() => {
            const members = indexes.get(key) ?? new Set<string>();
            members.add(value);
            indexes.set(key, members);
          });
          return transaction;
        },
        expire() {
          return transaction;
        },
        del(keys: string | string[]) {
          writes.push(() => {
            for (const key of [keys].flat()) {
              values.delete(key);
              indexes.delete(key);
            }
          });
          return transaction;
        },
        async exec() {
          writes.forEach((write) => write());
        },
      };
      return transaction;
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("incremental cache invalidation", () => {
  it("invalidates generated pages using Next's implicit header tags across instances", async () => {
    vi.useFakeTimers();
    const store = createSharedStore();
    const first = loadAdapter(store);
    const second = loadAdapter(store);
    await first.set("page", {
      kind: "APP_PAGE",
      headers: { "x-next-cache-tags": "_N_T_/page" },
    });
    expect(await second.get("page")).toBeDefined();
    vi.advanceTimersByTime(1000);
    await second.revalidateTag(["_N_T_/page"]);
    await expect(first.get("page")).resolves.toBeNull();
  });

  it("checks fetch soft tags even when they were not indexed at write time", async () => {
    vi.useFakeTimers();
    const handler = loadAdapter(createSharedStore());
    await handler.set("fetch", { kind: "FETCH" });
    vi.advanceTimersByTime(1000);
    await handler.revalidateTag(["_N_T_/page"]);
    await expect(
      handler.get("fetch", { softTags: ["_N_T_/page"] }),
    ).resolves.toBeNull();
  });

  it("retains generated pages until delayed tag expiration, then expires them", async () => {
    vi.useFakeTimers();
    const handler = loadAdapter(createSharedStore());
    await handler.set("page", {
      kind: "APP_PAGE",
      headers: { "x-next-cache-tags": "catalog" },
    });
    vi.advanceTimersByTime(1000);
    await handler.revalidateTag(["catalog"], { expire: 60 });
    expect(await handler.get("page")).toBeDefined();
    vi.advanceTimersByTime(61000);
    await expect(handler.get("page")).resolves.toBeNull();
  });
});
