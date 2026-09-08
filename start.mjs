import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const requireFromLauncher = createRequire(import.meta.url);

export function getRedisCacheUrl(environment = process.env) {
  return environment.SCALINGO_REDIS_URL ?? environment.REDIS_URL;
}

export function configureServerBinding(environment = process.env) {
  // Scalingo requires web processes to listen on every network interface.
  // Its container hostname must not be used as Next's bind address.
  environment.HOSTNAME = "0.0.0.0";
}

export async function assertRedisCacheAvailable(environment = process.env) {
  const url = getRedisCacheUrl(environment);

  if (!url) {
    console.info("Redis cache is not configured; using Next.js local cache");
    return;
  }

  // Load the handler from Next's standalone bundle, where its normal
  // `require("redis")` resolves after Scalingo removes root node_modules.
  const { assertRedisCacheAvailable: assertFromCacheHandler } =
    requireFromLauncher("./.next/standalone/cache-handler.js");
  await assertFromCacheHandler(environment);
}

export async function start() {
  await assertRedisCacheAvailable();
  configureServerBinding();
  requireFromLauncher("./.next/standalone/server.js");
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  await start();
}
