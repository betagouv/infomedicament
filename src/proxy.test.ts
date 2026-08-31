import { beforeEach, describe, expect, it, vi } from "vitest";
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
      "Request received",
    );
  });

  it("generates a request ID for bypassed asset requests", () => {
    const req = new NextRequest("http://localhost/_next/static/app.js");

    const response = proxy(req);

    expect(response.headers.get("x-request-id")).toMatch(/^[0-9a-f-]{36}$/);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "http.request",
        request_id: response.headers.get("x-request-id"),
        path: "/_next/static/app.js",
        outcome: "bypassed",
      }),
      "Request received",
    );
  });
});
