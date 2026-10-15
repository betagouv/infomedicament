// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { POST } from "./route";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function request(authorization?: string, query = "") {
  return new Request(`http://localhost/api/invalidate${query}`, {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });
}

describe("POST /api/invalidate", () => {
  beforeEach(() => {
    vi.stubEnv("CACHE_INVALIDATION_TOKEN", "test-import-secret");
    vi.clearAllMocks();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("is disabled when no secret is configured", async () => {
    vi.stubEnv("CACHE_INVALIDATION_TOKEN", "");
    const response = await POST(request("Bearer test-import-secret"));
    expect(response.status).toBe(503);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([undefined, "Bearer wrong", "Basic test-import-secret", "test-import-secret"])(
    "rejects unauthorized requests (%s) without invalidating caches",
    async (authorization) => {
      const response = await POST(request(authorization));
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toBe("Bearer");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("does not accept secrets in query parameters", async () => {
    const response = await POST(request(undefined, "?token=test-import-secret"));
    expect(response.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates every route and its data after bearer authentication", async () => {
    const response = await POST(request("Bearer test-import-secret"));
    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledExactlyOnceWith("/", "layout");
    expect(await response.json()).toEqual({
      invalidated: true,
      scope: "all",
      regeneration: "on-next-request",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("does not report success if invalidation cannot be scheduled", async () => {
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error("Invalidation failed");
    });
    await expect(POST(request("Bearer test-import-secret"))).rejects.toThrow(
      "Invalidation failed",
    );
  });
});
