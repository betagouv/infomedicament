import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { createClient } from "redis";

const require = createRequire(import.meta.url);

export function getRedisCacheUrl(environment = process.env) {
  return environment.SCALINGO_REDIS_URL ?? environment.REDIS_URL;
}

export async function assertRedisCacheAvailable(environment = process.env) {
  const url = getRedisCacheUrl(environment);

  if (!url) {
    console.info("Redis cache is not configured; using Next.js local cache");
    return;
  }

  const client = createClient({
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

export async function start() {
  await assertRedisCacheAvailable();
  require("./.next/standalone/server.js");
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  await start();
}
