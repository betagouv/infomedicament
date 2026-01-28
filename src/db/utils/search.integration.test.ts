import { describe, it, expect, vi } from "vitest";
import { getSearchResults } from "@/db/utils/search";

// disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

// Disable server-only for tests
vi.mock("server-only", () => ({}));

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

    it("must not allow for typos in short search terms (between 3 and 5 characters)", async () => {
        const results = await getSearchResults("acne");
        // Check with regex that each result contains the query without typo
        const queryRegex = new RegExp(`acn[eé]`, 'i');

        for (const result of results) {
            let matchFound = false;

            // ignore objects that are not ResumeSpecGroup since we'll drop them soon
            if (!("groupName" in result)) {
                continue;
            }

            // 1. Check Group Name
            if ("groupName" in result && result.groupName && queryRegex.test(result.groupName)) {
                matchFound = true;
            }
            // 2. Check Composants
            else if ("composants" in result && typeof result.composants === 'string' && queryRegex.test(result.composants)) {
                matchFound = true;
            }
            // 3. Check ATC Labels
            else if ("atc1Label" in result && result.atc1Label && queryRegex.test(result.atc1Label)) {
                matchFound = true;
            }
            else if ("atc2Label" in result && result.atc2Label && queryRegex.test(result.atc2Label)) {
                matchFound = true;
            }

            if (!matchFound) {
                console.log(result);
            }

            expect(matchFound).toBe(true);
        }
    });

    it("must search in the beginning of specialite names for short terms (<= 3 chars)", async () => {
        const query = "ac";
        const results = await getSearchResults(query);

        expect(results.length).toBeGreaterThan(0);

        // Check with regex that each result contains the query at the beginning of a word
        const queryRegex = new RegExp(`\\b${query}`, 'i');

        for (const result of results) {
            let matchFound = false;

            // Check Group Name (ex: "ACTIFED")
            // For short queries, we only search in specialite names
            if ("groupName" in result && result.groupName && queryRegex.test(result.groupName)) {
                matchFound = true;
            }

            // useful to debug failing tests
            if (!matchFound) {
                console.log(result);
            }

            expect(matchFound).toBe(true);
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