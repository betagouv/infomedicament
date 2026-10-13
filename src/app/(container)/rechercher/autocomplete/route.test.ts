import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getAutocompleteSuggestions } from "@/db/utils";

vi.mock("@/db/utils", () => ({ getAutocompleteSuggestions: vi.fn() }));

function request(query?: string) {
  const params = query === undefined ? "" : new URLSearchParams({ s: query }).toString();
  return new NextRequest(`http://localhost/rechercher/autocomplete?${params}`);
}

describe("autocomplete input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAutocompleteSuggestions).mockResolvedValue([]);
  });

  it.each([undefined, "", "  ", "x".repeat(201)])("rejects missing, blank or oversized input", async (query) => {
    expect((await GET(request(query))).status).toBe(400);
    expect(getAutocompleteSuggestions).not.toHaveBeenCalled();
  });

  it("trims input before passing it to search", async () => {
    const response = await GET(request("  paracetamol  "));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(getAutocompleteSuggestions).toHaveBeenCalledExactlyOnceWith("paracetamol");
  });

  it("accepts queries at the length limit", async () => {
    expect((await GET(request("x".repeat(200)))).status).toBe(200);
    expect(getAutocompleteSuggestions).toHaveBeenCalledExactlyOnceWith("x".repeat(200));
  });
});
