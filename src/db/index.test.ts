import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Pool } from "pg";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

vi.mock("pg", () => ({ Pool: vi.fn(function Pool() {}) }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => vi.unstubAllEnvs());

it.each([
  [PHASE_PRODUCTION_BUILD, 3],
  [PHASE_PRODUCTION_SERVER, 10],
  [PHASE_DEVELOPMENT_SERVER, 10],
  [undefined, 10],
])("configures phase %s with a pool limit of %i", async (phase, max) => {
  vi.stubEnv("NEXT_PHASE", phase);
  await import("./index");

  expect(Pool).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ max }),
  );
});
