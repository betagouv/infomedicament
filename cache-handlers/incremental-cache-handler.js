const { createHash } = require("node:crypto");
const { deserialize, serialize } = require("node:v8");
const { createClient } = require("redis");
const { PHASE_PRODUCTION_BUILD } = require("next/constants");
const FileSystemCache =
  require("next/dist/server/lib/incremental-cache/file-system-cache").default;

const DEFAULT_TTL_SECONDS = 365 * 24 * 60 * 60;
const MINIMUM_STALE_WINDOW_SECONDS = 60;
const LOCAL_MEMORY_CACHE_BYTES = 50 * 1024 * 1024;

function digest(value) {
  return createHash("sha256").update(value).digest("base64url");
}

function getNamespace() {
  const application = process.env.APP ?? "info-medicament";
  const version =
    process.env.CONTAINER_VERSION ?? process.env.SOURCE_VERSION ?? "default";

  return `next-cache:${digest(`${application}:${version}`).slice(0, 24)}`;
}

function getTtlSeconds(data, context = {}) {
  const revalidate = context.cacheControl?.revalidate ?? data?.revalidate;
  const expire = context.cacheControl?.expire;

  if (Number.isFinite(expire) && expire > 0) {
    return Math.ceil(expire);
  }

  if (Number.isFinite(revalidate) && revalidate > 0) {
    return Math.ceil(
      Math.max(revalidate * 1.5, revalidate + MINIMUM_STALE_WINDOW_SECONDS),
    );
  }

  return DEFAULT_TTL_SECONDS;
}

function encode(value) {
  return serialize(value).toString("base64");
}

function decode(value) {
  return deserialize(Buffer.from(value, "base64"));
}

function shouldUseRedis(environment = process.env) {
  return Boolean(
    environment.NEXT_PHASE !== PHASE_PRODUCTION_BUILD &&
      (environment.SCALINGO_REDIS_URL ?? environment.REDIS_URL),
  );
}

async function assertRedisCacheAvailable(
  environment = process.env,
  createRedisClient = createClient,
) {
  const url = environment.SCALINGO_REDIS_URL ?? environment.REDIS_URL;

  if (!url) {
    console.info("Redis cache is not configured; using Next.js local cache");
    return;
  }

  const client = createRedisClient({
    url,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 5_000,
      reconnectStrategy: false,
    },
  });

  client.on("error", (error) => {
    console.error("Redis cache startup check failed", error);
  });

  try {
    await client.connect();
    await client.ping();
    console.info("Redis cache is configured and reachable");
  } catch (error) {
    throw new Error(
      "Redis cache is configured but unavailable; refusing to start with an inconsistent local cache",
      { cause: error },
    );
  } finally {
    if (client.isReady) {
      await client.quit();
    } else if (client.isOpen) {
      client.destroy();
    }
  }
}

class RedisCacheHandler {
  constructor(context) {
    if (!shouldUseRedis()) {
      return new FileSystemCache({
        ...context,
        maxMemoryCacheSize: LOCAL_MEMORY_CACHE_BYTES,
      });
    }

    const redisUrl = process.env.SCALINGO_REDIS_URL ?? process.env.REDIS_URL;
    this.namespace = getNamespace();

    this.client = createClient({
      url: redisUrl,
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy(retries) {
          return Math.min(100 * 2 ** retries, 3_000);
        },
      },
    });
    this.client.on("error", (error) => {
      console.error("Redis cache connection error", error);
    });
    this.connection = this.client.connect();
  }

  cacheKey(key) {
    return `${this.namespace}:entry:${digest(key)}`;
  }

  tagKey(tag) {
    return `${this.namespace}:tag:${digest(tag)}`;
  }

  async get(key, context = {}) {
    try {
      await this.connection;
      const stored = await this.client.get(this.cacheKey(key));
      if (!stored) return null;
      const record = decode(stored);
      const tags = [
        ...(record.tags ?? []),
        ...(context.tags ?? []),
        ...(context.softTags ?? []),
      ];
      if (tags.length > 0) {
        const timestamps = await this.client.mGet(
          tags.map((tag) => `${this.tagKey(tag)}:expired`),
        );
        const now = Date.now();
        if (
          timestamps.some(
            (value) =>
              Number(value) > record.lastModified && Number(value) <= now,
          )
        ) {
          return null;
        }
      }
      return record;
    } catch (error) {
      console.error("Redis incremental-cache read failed", error);
      return null;
    }
  }

  async set(key, data, context = {}) {
    try {
      // Next carries implicit route tags in generated page/route headers.
      const headerTags = data?.headers?.["x-next-cache-tags"];
      const tags = [
        ...new Set([
          ...(context.tags ?? []),
          ...(typeof headerTags === "string" ? headerTags.split(",") : []),
        ]),
      ];
      const record = {
        value: data,
        lastModified: Date.now(),
        tags,
      };

      await this.connection;
      const cacheKey = this.cacheKey(key);
      const ttl = getTtlSeconds(data, context);
      const transaction = this.client.multi().set(cacheKey, encode(record), {
        EX: ttl,
      });

      for (const tag of tags) {
        transaction.sAdd(this.tagKey(tag), cacheKey);
        // Keep the tag index for at least as long as its longest-lived entry.
        transaction.expire(this.tagKey(tag), ttl, "NX");
        transaction.expire(this.tagKey(tag), ttl, "GT");
      }

      await transaction.exec();
    } catch (error) {
      console.error("Redis incremental-cache write failed", error);
    }
  }

  async revalidateTag(tags, durations) {
    const tagList = [tags].flat();

    await this.connection;

    for (const tag of tagList) {
      const tagKey = this.tagKey(tag);
      const cacheKeys = await this.client.sMembers(tagKey);
      const transaction = this.client.multi();

      // Persist an invalidation marker as well as deleting indexed entries.
      // Fetch soft tags may only be known at read time, and delayed expiration
      // must retain the marker after its grace period has elapsed.
      const expiresAt =
        durations === undefined
          ? Date.now()
          : durations.expire !== undefined
            ? Date.now() + durations.expire * 1000
            : undefined;
      if (expiresAt !== undefined) {
        transaction.set(`${tagKey}:expired`, String(expiresAt));
      }
      if (durations !== undefined && durations.expire !== 0) {
        await transaction.exec();
        continue;
      }
      if (cacheKeys.length > 0) {
        transaction.del(cacheKeys);
      }
      transaction.del(tagKey);
      await transaction.exec();
    }
  }

  resetRequestCache() {}
}

module.exports = RedisCacheHandler;
module.exports.assertRedisCacheAvailable = assertRedisCacheAvailable;
module.exports.__testing = {
  decode,
  encode,
  getNamespace,
  getTtlSeconds,
  shouldUseRedis,
};
