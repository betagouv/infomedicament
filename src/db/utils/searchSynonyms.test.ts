import { describe, it, expect, vi } from "vitest";

// expandQuery is pure, but importing the module also pulls in getSynonymMap
// (db + next/cache), so stub those so the import succeeds.
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));
vi.mock("@/db", () => ({ default: {} }));

import { expandQuery, matchedCanonicals } from "./searchSynonyms";
import { SearchSynonym } from "@/db/types";

const syn = (alias: string, canonical: string): SearchSynonym => ({ id: 0, alias, canonical });

describe("expandQuery", () => {
  it("adds the canonical term for a single matching alias", () => {
    const terms = expandQuery("mal de tete", [syn("mal de tete", "céphalées")]);
    expect(terms).toEqual(["mal de tete", "cephalees"]);
  });

  it("matches a multi-word alias regardless of connector words", () => {
    const terms = expandQuery("maux de tete", [syn("maux de tete", "céphalées")]);
    expect(terms).toContain("cephalees");
  });

  it("tolerates French plurals on significant words via stem matching", () => {
    const terms = expandQuery("maux de tetes", [syn("maux de tete", "céphalées")]);
    expect(terms).toContain("cephalees");
  });

  it("returns the query unchanged when no alias matches", () => {
    const terms = expandQuery("doliprane", [syn("mal de tete", "céphalées")]);
    expect(terms).toEqual(["doliprane"]);
  });

  it("keeps the original query and adds the canonical when an alias is embedded in a longer query", () => {
    const terms = expandQuery("doliprane mal de tete", [syn("mal de tete", "céphalées")]);
    expect(terms).toEqual(["doliprane mal de tete", "cephalees"]);
  });

  it("dedupes canonical terms when several aliases map to the same term", () => {
    const terms = expandQuery("mal de tete", [
      syn("mal de tete", "céphalées"),
      syn("mal de tete", "céphalées"),
    ]);
    expect(terms).toEqual(["mal de tete", "cephalees"]);
  });
});

describe("matchedCanonicals", () => {
  it("returns the canonical term in its accented form when an alias matches", () => {
    const terms = matchedCanonicals("mal de tete", [syn("mal de tete", "céphalées")]);
    expect(terms).toEqual(["céphalées"]);
  });

  it("returns nothing when no alias matches", () => {
    const terms = matchedCanonicals("doliprane", [syn("mal de tete", "céphalées")]);
    expect(terms).toEqual([]);
  });

  it("dedupes by normalized form when several aliases map to the same canonical", () => {
    const terms = matchedCanonicals("mal de tete", [
      syn("mal de tete", "céphalées"),
      syn("mal de tete", "Céphalées"),
    ]);
    expect(terms).toEqual(["céphalées"]);
  });
});
