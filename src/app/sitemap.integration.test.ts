import { describe, it, expect, vi } from "vitest";
import sitemap from "./sitemap";

vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("sitemap (Integration)", () => {
  it("returns a non-empty list with expected route prefixes", async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    expect(urls.length).toBeGreaterThan(1000);
    expect(urls.some((u) => u.includes("/medicaments/"))).toBe(true);
    expect(urls.some((u) => u.includes("/substances/"))).toBe(true);
    expect(urls.some((u) => u.includes("/indications/"))).toBe(true);
    expect(urls.some((u) => u.includes("/articles/"))).toBe(true);
    expect(urls.some((u) => u.includes("/generiques/"))).toBe(true);
    expect(urls.some((u) => u.includes("/glossaire/"))).toBe(true);
    expect(urls.some((u) => /\/atc\/[A-Z]$/.test(u))).toBe(true);
    expect(urls.some((u) => /\/atc\/[A-Z]\d{2}$/.test(u))).toBe(true);
  });
});
