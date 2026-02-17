import { describe, it, expect, vi } from "vitest";
import { getArticlesFromSearchResults } from "./articles";

vi.mock("server-only", () => ({}));

const mockExecute = vi.fn();
vi.mock("@/db/", () => ({
  default: {
    selectFrom: () => ({ select: () => ({ execute: (...args: any[]) => mockExecute(...args) }) }),
  },
}));

describe("getArticlesFromSearchResults", () => {
  it("should match articles by CIS, substance, pathology and ATC from search results", async () => {
    mockExecute.mockResolvedValue([
      { titre: "Match CIS", lien: "#", metadescription: "", homepage: false, atc_classe: "", substances: "", specialites: "111", pathologies: "" },
      { titre: "Match ATC", lien: "#", metadescription: "", homepage: false, atc_classe: "N05", substances: "", specialites: "", pathologies: "" },
      { titre: "Match Pathologie", lien: "#", metadescription: "", homepage: false, atc_classe: "", substances: "", specialites: "", pathologies: "123" },
      { titre: "Match Substance", lien: "#", metadescription: "", homepage: false, atc_classe: "", substances: "666", specialites: "", pathologies: "" },
      { titre: "No Match", lien: "#", metadescription: "", homepage: false, atc_classe: "", substances: "", specialites: "999", pathologies: "" },
    ]);

    const articles = await getArticlesFromSearchResults([{
      groupName: "TEST", composants: "", specialites: [], resumeSpecialites: [], matchReasons: [],
      CISList: ["111"], subsIds: ["666", "999"], pathosCodes: ["123", "124"], atc2Code: "N05",
    } as any]);

    expect(articles).toHaveLength(4);
    expect(articles.map((a) => a.title)).toEqual(["Match CIS", "Match ATC", "Match Pathologie", "Match Substance"]);
  });
});
