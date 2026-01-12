import { describe, it, expect, vi } from "vitest";
import { getSearchResults } from "@/db/utils/search";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("Search engine (Integration) -- Functional Tests", () => {

    it("must return at least one result for valid search terms", async () => {
        const results = await getSearchResults("Paracétamol");

        // Check that we have some results
        expect(results.length).toBeGreaterThan(0);
    });

    it("must handle a search with no results", async () => {
        const results = await getSearchResults("Anticonstitutionnellement");
        expect(results).toEqual([]);
    });

    it("must handle an empty search and return an empty array", async () => {
        const results = await getSearchResults("");
        expect(results).toEqual([]);
    });

    it("must return results when there is a typo in the search term", async () => {
        const results = await getSearchResults("Paracetmol");

        // Check that we have some results
        expect(results.length).toBeGreaterThan(0);

        // Check that at least one of the results has paracétamol as a composant
        const paracetamolGroup = results.find((item) => {
            return "composants" in item && /paracétamol/i.test(item.composants);
        });

        expect(paracetamolGroup).toBeDefined();
    });

    it("must return results for one-character search terms", async () => {
        // this is useful for autocompletion in the search bar
        const results = await getSearchResults("a");
        expect(results.length).toBeGreaterThan(0);
    });

    it("must not allow for typos in short search terms", async () => {
        const results = await getSearchResults("acne");
        // Check that all results contain 'acne' in their token (no typo allowed)
        for (const result of results) {
            if ("groupName" in result) { // TODO: fixme when types are refactored and made simpler
                expect(result.groupName.toLowerCase()).toContain("acne");
            }
        }
    });
});

describe("Search engine (Integration) -- Business Logic Tests", () => {
    it("must return results for 'Doliprane'", async () => {
        const results = await getSearchResults("Doliprane");

        // Check that we have some results
        expect(results.length).toBeGreaterThan(0);

        // Check that at least one of the results is related to Doliprane
        // In an object ResumeSpecGroup with key 'groupName'
        const doliGroup = results.find((item) => {
            return "groupName" in item && /doliprane/i.test(item.groupName);
        });

        expect(doliGroup).toBeDefined();
    });

    it("must return Doliprane when searching for 'Paracétamol'", async () => {
        const results = await getSearchResults("Paracétamol");

        // Check that at least one of the spécialité is related to Doliprane
        // In an object ResumeSpecGroup with key 'groupName'
        const doliGroup = results.find((item) => {
            return "groupName" in item && /doliprane/i.test(item.groupName);
        });

        expect(doliGroup).toBeDefined();
    });
});