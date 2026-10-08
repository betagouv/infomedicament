import { execFile } from "node:child_process";
import { copyFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import {
  assertRedisCacheAvailable,
  getRedisCacheUrl,
} from "./start.mjs";

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

  it("starts from the standalone bundle and preserves the configured hostname and port", async () => {
    const deploymentDirectory = await mkdtemp(join(tmpdir(), "next-start-"));
    const deployedLauncher = join(deploymentDirectory, "start.mjs");
    const packagedHandlerDirectory = join(
      deploymentDirectory,
      ".next/standalone/cache-handlers",
    );

    try {
      await copyFile(join(process.cwd(), "start.mjs"), deployedLauncher);
      await mkdir(packagedHandlerDirectory, { recursive: true });
      await writeFile(
        join(packagedHandlerDirectory, "incremental-cache-handler.js"),
        'module.exports.assertRedisCacheAvailable = async () => { console.log("cache-ready"); };',
      );
      await writeFile(
        join(deploymentDirectory, ".next/standalone/server.js"),
        'console.log("binding:" + process.env.HOSTNAME + ":" + process.env.PORT);',
      );
      const { stdout } = await execFileAsync(process.execPath, [
        "--input-type=module",
        "--eval",
        `const launcher = await import(${JSON.stringify(deployedLauncher)});
         await launcher.start();`,
      ], {
        env: {
          ...process.env,
          REDIS_URL: "redis://cache",
          SCALINGO_REDIS_URL: "redis://cache",
          HOSTNAME: "127.0.0.1",
          PORT: "4321",
        },
      });
      expect(stdout).toContain("cache-ready");
      expect(stdout).toContain("binding:127.0.0.1:4321");
    } finally {
      await rm(deploymentDirectory, { recursive: true, force: true });
    }
  });
});
