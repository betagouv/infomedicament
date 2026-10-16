import { describe, it, expect, vi } from "vitest";
import { getArticlesFromFilters, getArticlesFromSearchResults } from "./articles";

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
      specId: "111", groupName: "TEST", composants: "", matchReasons: [],
      subsIds: ["666", "999"], codePathos: [123, 124], atc2Code: "N05",
    } as any]);
    
    expect(articles).toHaveLength(3);
    //For now "Match Pathologie" is not available
    expect(articles.map((a) => a.title)).toEqual(["Match CIS", "Match ATC", "Match Substance"]);
  });
});

describe("nullable article relationships", () => {
  const row = {
    titre: "Article", lien: "#", metadescription: "Description", homepage: false,
    atc_classe: null, substances: null, specialites: null, pathologies: null,
  };
  const filters = {
    ATCList: ["N05"], substancesList: ["666"], specialitesList: ["111"], pathologiesList: [123],
  };

  it.each([
    ["atc_classe", " N05 ", "atc", "N05"],
    ["pathologies", " 123 ", "pathologies", "123"],
    ["substances", " 666 ", "substances", "666"],
    ["specialites", " 111 ", "specialites", "111"],
  ])("maps an article matched only through %s with all other relationships null", async (column, value, field, identifier) => {
    mockExecute.mockResolvedValue([{ ...row, [column]: value }]);
    expect(await getArticlesFromFilters(filters)).toEqual([{
      slug: "article", title: "Article", canonicalUrl: "#", description: "Description",
      atc: [], pathologies: [], substances: [], specialites: [],
      [field]: [identifier],
    }]);
  });

  it("parses every relationship field into trimmed arrays without empty entries", async () => {
    mockExecute.mockResolvedValue([{
      ...row, atc_classe: " N05, , N06,", pathologies: "123, 456",
      substances: "666, 777", specialites: "111, 222",
    }]);
    expect((await getArticlesFromFilters(filters))[0]).toMatchObject({
      atc: ["N05", "N06"], pathologies: ["123", "456"],
      substances: ["666", "777"], specialites: ["111", "222"],
    });
  });

  it("does not match articles with null or blank relationships", async () => {
    mockExecute.mockResolvedValue([row, {
      ...row, atc_classe: " , ", substances: "", specialites: "  ", pathologies: "",
    }]);
    expect(await getArticlesFromFilters(filters)).toEqual([]);
  });
});
