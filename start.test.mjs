import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { assertRedisCacheAvailable, getRedisCacheUrl } from "./start.mjs";

const execFileAsync = promisify(execFile);

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

  it("loads when root node_modules is excluded from the deployment", async () => {
    const deploymentDirectory = await mkdtemp(join(tmpdir(), "next-start-"));
    const deployedLauncher = join(deploymentDirectory, "start.mjs");
    const packagedRedisDirectory = join(
      deploymentDirectory,
      ".next/standalone/node_modules/redis",
    );

    try {
      await copyFile(join(process.cwd(), "start.mjs"), deployedLauncher);
      await mkdir(packagedRedisDirectory, { recursive: true });
      await writeFile(
        join(packagedRedisDirectory, "index.js"),
        `module.exports = {
          createClient() {
            return {
              on() {},
              async connect() {},
              async ping() {},
              isReady: true,
              async quit() {},
            };
          },
        };`,
      );
      await execFileAsync(process.execPath, [
        "--input-type=module",
        "--eval",
        `const launcher = await import(${JSON.stringify(deployedLauncher)});
         await launcher.assertRedisCacheAvailable({ REDIS_URL: "redis://cache" });`,
      ]);
    } finally {
      await rm(deploymentDirectory, { recursive: true, force: true });
    }
  });
});
