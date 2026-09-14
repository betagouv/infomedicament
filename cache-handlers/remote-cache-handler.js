const { createHash } = require("node:crypto");
const { createClient } = require("redis");
const { PHASE_PRODUCTION_BUILD } = require("next/constants");

const DEFAULT_TTL_SECONDS = 365 * 24 * 60 * 60;
const LOCAL_CACHE_MAX_BYTES = 50 * 1024 * 1024;
const localEntries = new Map();
let localEntriesSize = 0;
const localTagTimestamps = new Map();
const pendingSets = new Map();

function digest(value) {
  return createHash("sha256").update(value).digest("base64url");
}

function getNamespace() {
  const application = process.env.APP ?? "info-medicament";
  const version =
    process.env.CONTAINER_VERSION ?? process.env.SOURCE_VERSION ?? "default";

  return `next-use-cache:${digest(`${application}:${version}`).slice(0, 24)}`;
}

function shouldUseRedis(environment = process.env) {
  return Boolean(
    environment.NEXT_PHASE !== PHASE_PRODUCTION_BUILD &&
      (environment.SCALINGO_REDIS_URL ?? environment.REDIS_URL),
  );
}

function getTtlSeconds(entry) {
  return Number.isFinite(entry.expire) && entry.expire > 0
    ? Math.ceil(entry.expire)
    : DEFAULT_TTL_SECONDS;
}

function entryKey(cacheKey) {
  return `${getNamespace()}:entry:${digest(cacheKey)}`;
}

function tagKey(tag) {
  return `${getNamespace()}:tag:${digest(tag)}`;
}

function serializeEntry(entry, value) {
  return JSON.stringify({
    value: value.toString("base64"),
    tags: entry.tags,
    stale: entry.stale,
    timestamp: entry.timestamp,
    expire: entry.expire,
    revalidate: entry.revalidate,
  });
}

function deserializeEntry(stored) {
  const entry = JSON.parse(stored);
  const value = Buffer.from(entry.value, "base64");

  return {
    ...entry,
    value: new ReadableStream({
      start(controller) {
        controller.enqueue(value);
        controller.close();
      },
    }),
  };
}

function getLocalEntry(cacheKey) {
  const stored = localEntries.get(cacheKey);
  if (!stored) return undefined;

  // Refresh insertion order so the first item remains the least recently used.
  localEntries.delete(cacheKey);
  localEntries.set(cacheKey, stored);
  return stored;
}

function setLocalEntry(cacheKey, stored) {
  const previous = localEntries.get(cacheKey);
  if (previous) localEntriesSize -= Buffer.byteLength(previous);

  localEntries.delete(cacheKey);
  localEntries.set(cacheKey, stored);
  localEntriesSize += Buffer.byteLength(stored);

  while (localEntriesSize > LOCAL_CACHE_MAX_BYTES) {
    const oldestKey = localEntries.keys().next().value;
    if (oldestKey === undefined) break;
    const oldest = localEntries.get(oldestKey);
    localEntries.delete(oldestKey);
    if (oldest) localEntriesSize -= Buffer.byteLength(oldest);
  }
}

async function streamToBuffer(stream) {
  const reader = stream.getReader();
  const chunks = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}

let redisClient;
let redisConnection;

function getRedisClient() {
  if (!shouldUseRedis()) return undefined;

  if (!redisClient) {
    redisClient = createClient({
      url: process.env.SCALINGO_REDIS_URL ?? process.env.REDIS_URL,
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 5_000,
        reconnectStrategy(retries) {
          return Math.min(100 * 2 ** retries, 3_000);
        },
      },
    });
    redisClient.on("error", (error) => {
      console.error("Redis use-cache connection error", error);
    });
    redisConnection = redisClient.connect();
  }

  return redisClient;
}

async function getExpiration(tags) {
  if (tags.length === 0) return 0;

  const client = getRedisClient();
  if (!client) {
    return Math.max(...tags.map((tag) => localTagTimestamps.get(tag) ?? 0), 0);
  }

  await redisConnection;
  const timestamps = await client.mGet(tags.map(tagKey));
  return Math.max(...timestamps.map((value) => Number(value) || 0), 0);
}

const remoteCacheHandler = {
  async get(cacheKey, softTags = []) {
    const pendingSet = pendingSets.get(cacheKey);
    if (pendingSet) await pendingSet;

    const client = getRedisClient();
    if (client) await redisConnection;
    const stored = client
      ? await client.get(entryKey(cacheKey))
      : getLocalEntry(cacheKey);
    if (!stored) return undefined;

    const entry = deserializeEntry(stored);
    const now = Date.now();
    const maxAge = client ? entry.expire : entry.revalidate;
    if (now > entry.timestamp + maxAge * 1000) return undefined;

    const invalidatedAt = await getExpiration([...entry.tags, ...softTags]);
    return invalidatedAt > entry.timestamp ? undefined : entry;
  },

  async set(cacheKey, pendingEntry) {
    const operation = (async () => {
      const entry = await pendingEntry;
      const value = await streamToBuffer(entry.value);
      const stored = serializeEntry(entry, value);
      const client = getRedisClient();

      if (!client) {
        setLocalEntry(cacheKey, stored);
        return;
      }

      await redisConnection;
      await client.set(entryKey(cacheKey), stored, {
        EX: getTtlSeconds(entry),
      });
    })();

    pendingSets.set(cacheKey, operation);
    try {
      await operation;
    } finally {
      pendingSets.delete(cacheKey);
    }
  },

  async refreshTags() {},

  getExpiration,

  async updateTags(tags, durations) {
    const timestamp = Date.now();
    const client = getRedisClient();

    if (!client) {
      for (const tag of tags) localTagTimestamps.set(tag, timestamp);
      return;
    }

    await redisConnection;
    const transaction = client.multi();
    for (const tag of tags) {
      const options = durations?.expire
        ? { EX: Math.ceil(durations.expire) }
        : undefined;
      transaction.set(tagKey(tag), String(timestamp), options);
    }
    await transaction.exec();
  },
};

module.exports = remoteCacheHandler;
module.exports.__testing = {
  deserializeEntry,
  getTtlSeconds,
  serializeEntry,
  shouldUseRedis,
  streamToBuffer,
};
