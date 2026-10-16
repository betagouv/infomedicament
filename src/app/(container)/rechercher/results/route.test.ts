import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { getSearchResults } from "@/db/utils";

vi.mock("@/db/utils", () => ({ getSearchResults: vi.fn() }));

describe("normal search results API", () => {
  beforeEach(() => {
    vi.mocked(getSearchResults).mockReset();
    vi.mocked(getSearchResults).mockResolvedValue([]);
  });
  const request = (query: string) =>
    GET(new NextRequest(`http://localhost/rechercher/results?${query}`));
  it.each([
    "s=paracetamol&advanced=1",
    "s=paracetamol&holder=Exemple",
    "documentType=rcp",
  ])("rejects advanced parameters: %s", async (query) => {
    const response = await request(query);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain(
      "/rechercher/advanced/results",
    );
    expect(getSearchResults).not.toHaveBeenCalled();
  });
  it("rejects invalid or missing input without querying the database", async () => {
    expect((await request("advanced=1&documentFrom=2024-02-30")).status).toBe(
      400,
    );
    expect((await request("")).status).toBe(400);
    expect(getSearchResults).not.toHaveBeenCalled();
  });
  it("preserves the ordinary endpoint's ten-result response", async () => {
    vi.mocked(getSearchResults).mockResolvedValue(
      Array.from({ length: 20 }, () => ({ specId: "1" })) as Awaited<
        ReturnType<typeof getSearchResults>
      >,
    );
    expect(await (await request("s=paracetamol")).json()).toHaveLength(10);
    expect(getSearchResults).toHaveBeenCalledWith("paracetamol");
  });
});
