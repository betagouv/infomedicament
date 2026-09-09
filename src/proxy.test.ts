import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const logger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({ logger }));

import { proxy } from "./proxy";

describe("proxy request logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs a structured event without query parameters", () => {
    const req = new NextRequest("http://localhost/rechercher?query=sensitive", {
      headers: { "x-request-id": "existing-request-id" },
    });

    const response = proxy(req);

    expect(response.headers.get("x-request-id")).toBe("existing-request-id");
    expect(logger.info).toHaveBeenCalledWith(
      {
        event: "http.request",
        request_id: "existing-request-id",
        method: "GET",
        path: "/rechercher",
        outcome: "forwarded",
      },
      "Request received: /rechercher",
    );
  });

  it("does not log static asset requests", () => {
    const req = new NextRequest("http://localhost/_next/static/app.js", {
      headers: { "x-forwarded-for": "static-path" },
    });

    const response = proxy(req);

    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get("X-RateLimit-Remaining")).toBeNull();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("logs non-static XHR calls", () => {
    const req = new NextRequest("http://localhost/api/debug/memory", {
      headers: { "sec-fetch-dest": "empty" },
    });

    proxy(req);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "http.request",
        path: "/api/debug/memory",
        outcome: "forwarded",
      }),
      "Request received: /api/debug/memory",
    );
  });

  it("does not log static requests identified by their fetch destination", () => {
    const req = new NextRequest("http://localhost/media/logo", {
      headers: { "sec-fetch-dest": "image" },
    });

    proxy(req);

    expect(logger.info).not.toHaveBeenCalled();
  });
});

describe("proxy rate limiting configuration", () => {
  const originalRateLimit = process.env.RATE_LIMIT;
  const originalRateLimitEnabled = process.env.RATE_LIMIT_ENABLED;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalRateLimit === undefined) delete process.env.RATE_LIMIT;
    else process.env.RATE_LIMIT = originalRateLimit;

    if (originalRateLimitEnabled === undefined) delete process.env.RATE_LIMIT_ENABLED;
    else process.env.RATE_LIMIT_ENABLED = originalRateLimitEnabled;
  });

  it("allows overriding the default rate limit", () => {
    process.env.RATE_LIMIT = "1";
    const headers = { "x-forwarded-for": "rate-limit-override" };

    expect(proxy(new NextRequest("http://localhost/medicaments/123", { headers })).status).toBe(200);
    expect(proxy(new NextRequest("http://localhost/medicaments/123", { headers })).status).toBe(429);
  });

  it("allows disabling the global rate limit", () => {
    process.env.RATE_LIMIT = "1";
    process.env.RATE_LIMIT_ENABLED = "false";
    const headers = { "x-forwarded-for": "rate-limit-disabled" };

    expect(proxy(new NextRequest("http://localhost/medicaments/123", { headers })).status).toBe(200);
    const response = proxy(new NextRequest("http://localhost/medicaments/123", { headers }));

    expect(response.status).toBe(200);
    expect(response.headers.has("X-RateLimit-Remaining")).toBe(false);
  });

  it("rate limits fetch requests", () => {
    process.env.RATE_LIMIT = "1";
    const headers = {
      "sec-fetch-dest": "empty",
      "x-forwarded-for": "fetch-rate-limit",
    };

    expect(proxy(new NextRequest("http://localhost/api/data", { headers })).status).toBe(200);
    expect(proxy(new NextRequest("http://localhost/api/data", { headers })).status).toBe(429);
  });

  it("does not count static requests against the application rate limit", () => {
    process.env.RATE_LIMIT = "1";
    const headers = {
      "sec-fetch-dest": "style",
      "x-forwarded-for": "static-rate-limit",
    };

    expect(proxy(new NextRequest("http://localhost/styles.css", { headers })).status).toBe(200);
    expect(proxy(new NextRequest("http://localhost/styles.css", { headers })).status).toBe(200);
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
