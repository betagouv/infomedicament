import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  canonicalPaths,
  longTailCisCodes,
  searchTerms,
} from "./test-data";

const target = process.env.TARGET_URL?.replace(/\/$/, "");

if (!target) {
  throw new Error(
    "TARGET_URL is required, for example TARGET_URL=https://staging.example.net npm run test:load",
  );
}

if (
  new URL(target).hostname === "infomedicament.beta.gouv.fr" &&
  process.env.ALLOW_PRODUCTION_LOAD_TEST !== "true"
) {
  throw new Error(
    "Set ALLOW_PRODUCTION_LOAD_TEST=true to confirm a production load test",
  );
}

function positiveNumber(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

function positiveInteger(name: string, fallback: number) {
  const value = positiveNumber(name, fallback);
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  return value;
}

function nonNegativeNumber(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a non-negative number`);
  }
  return value;
}

const popularCisCodes = readFileSync(
  resolve(process.cwd(), "scripts/seed_cis_codes.txt"),
  "utf8",
)
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const arrivalRate = nonNegativeNumber("ARRIVAL_RATE", 0);
const rampTo = positiveNumber("RAMP_TO", 50);
const maxVusers = positiveInteger("MAX_VUS", 100);
const phases = [
  {
    duration: positiveInteger("RAMP_DURATION_SECONDS", 60),
    arrivalRate,
    rampTo,
    maxVusers,
    name: "Ramp up",
  },
  {
    duration: positiveInteger("PLATEAU_DURATION_SECONDS", 180),
    arrivalRate: rampTo,
    maxVusers,
    name: "Plateau",
  },
];

export const config = {
  target,
  phases,
  http: {
    timeout: positiveNumber("TIMEOUT_SECONDS", 10),
    extendedMetrics: true,
    defaults: {
      headers: {
        "user-agent": "infomedicament-artillery-load-test",
        "x-load-test-id": "{{ $testId }}",
      },
    },
  },
  plugins: {
    expect: {
      expectDefault200: true,
      reportFailuresAsErrors: true,
      outputFormat: "prettyError",
    },
    ensure: {
      thresholds: [
        {
          "http.response_time.p95": positiveInteger("P95_MS", 2000),
        },
      ],
      conditions: [
        {
          expression: `vusers.failed / vusers.created * 100 < ${positiveNumber("MAX_ERROR_RATE_PERCENT", 1)}`,
        },
      ],
    },
  },
  variables: {
    popularCisCode: popularCisCodes,
    longTailCisCode: longTailCisCodes,
    searchTerm: searchTerms,
    canonicalPath: canonicalPaths,
  },
};

export const scenarios = [
  {
    name: "Popular medicine page",
    weight: positiveInteger("POPULAR_MEDICINE_WEIGHT", 40),
    flow: [{ get: { url: "/medicaments/{{ popularCisCode }}" } }],
  },
  {
    name: "Long-tail medicine page",
    weight: positiveInteger("LONG_TAIL_MEDICINE_WEIGHT", 40),
    flow: [{ get: { url: "/medicaments/{{ longTailCisCode }}" } }],
  },
  {
    name: "Search endpoint",
    weight: positiveInteger("SEARCH_WEIGHT", 10),
    flow: [
      {
        get: {
          url: "/rechercher/results",
          qs: { s: "{{ searchTerm }}" },
        },
      },
    ],
  },
  {
    name: "Homepage",
    weight: positiveInteger("HOMEPAGE_WEIGHT", 5),
    flow: [{ get: { url: "/" } }],
  },
  {
    name: "Other canonical page",
    weight: positiveInteger("CANONICAL_PAGE_WEIGHT", 5),
    flow: [{ get: { url: "{{ canonicalPath }}" } }],
  },
];
