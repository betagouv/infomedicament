import { describe, it, expect, vi, beforeAll } from "vitest";
import { searchInteractions, lookupInteractions } from "@/db/utils/interactions";
import { InteractionsSearchEntry } from "@/db/types";

vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));

// ---------------------------------------------------------------------------
// searchInteractions
// ---------------------------------------------------------------------------

describe("searchInteractions", () => {
  it("returns [] for an empty string", async () => {
    expect(await searchInteractions("")).toEqual([]);
  });

  it("returns [] for a single character (length guard)", async () => {
    expect(await searchInteractions("a")).toEqual([]);
  });

  it("returns [] for a non-matching query", async () => {
    expect(await searchInteractions("xyzzynonexistent")).toEqual([]);
  });

  it("returns results for 'ibuprof' with the correct shape", async () => {
    const results = await searchInteractions("ibuprof");
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty("id");
      expect(r).toHaveProperty("label");
      expect(r).toHaveProperty("type");
      expect(r).toHaveProperty("subst_ids");
      expect(r).toHaveProperty("class_ids");
      expect(["substance", "medicament", "class"]).toContain(r.type);
    }
  });

  it("returns a class entry for 'pamplemousse'", async () => {
    const results = await searchInteractions("pamplemousse");
    const classEntry = results.find((r) => r.type === "class");
    expect(classEntry).toBeDefined();
    expect(classEntry!.class_ids.length).toBeGreaterThan(0);
    expect(classEntry!.subst_ids).toHaveLength(0);
  });

  it("never returns more than 20 results", async () => {
    const results = await searchInteractions("a");
    // empty because of the length guard — but any valid query is capped at 20
    expect(results.length).toBeLessThanOrEqual(20);

    const results2 = await searchInteractions("ibuprof");
    expect(results2.length).toBeLessThanOrEqual(20);
  });
});

// ---------------------------------------------------------------------------
// lookupInteractions
// ---------------------------------------------------------------------------

describe("lookupInteractions", () => {
  let ibuprofeneEntry: InteractionsSearchEntry;
  let sertralineEntry: InteractionsSearchEntry;
  let pamplemousseEntry: InteractionsSearchEntry;
  let simvastatineEntry: InteractionsSearchEntry;

  beforeAll(async () => {
    const [ibup, sert, pampl, simva] = await Promise.all([
      searchInteractions("ibuprof"),
      searchInteractions("sertraline"),
      searchInteractions("pamplemousse"),
      searchInteractions("simvastatine"),
    ]);
    ibuprofeneEntry = ibup.find((e) => /ibuprof/i.test(e.label))!;
    sertralineEntry = sert.find((e) => /sertraline/i.test(e.label))!;
    pamplemousseEntry = pampl.find((e) => e.type === "class")!;
    simvastatineEntry = simva.find((e) => /simvastatine/i.test(e.label))!;
  });

  it("returns [] when both sides are empty", async () => {
    expect(await lookupInteractions([], [], [], [])).toEqual([]);
  });

  it("returns [] when only side 1 has IDs", async () => {
    expect(
      await lookupInteractions(ibuprofeneEntry.subst_ids, [], [], [])
    ).toEqual([]);
  });

  it("returns [] when only side 2 has IDs", async () => {
    expect(
      await lookupInteractions([], [], sertralineEntry.subst_ids, [])
    ).toEqual([]);
  });

  it("returns interactions for ibuprofène ⇄ sertraline (subst ↔ subst)", async () => {
    const results = await lookupInteractions(
      ibuprofeneEntry.subst_ids,
      ibuprofeneEntry.class_ids,
      sertralineEntry.subst_ids,
      sertralineEntry.class_ids,
    );
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r).toHaveProperty("niveau");
      expect(r).toHaveProperty("subst1_name");
      expect(r).toHaveProperty("subst2_name");
      expect(r.subst1_name).toBeTruthy();
      expect(r.subst2_name).toBeTruthy();
    }
  });

  it("returns interactions for pamplemousse ⇄ simvastatine (class ↔ subst)", async () => {
    const results = await lookupInteractions(
      pamplemousseEntry.subst_ids,
      pamplemousseEntry.class_ids,
      simvastatineEntry.subst_ids,
      simvastatineEntry.class_ids,
    );
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns [] for a pair with no known interaction", async () => {
    // Substance ID that does not exist in the DB — guaranteed no match
    const results = await lookupInteractions(
      ["NONE_EXISTING_999"],
      [],
      sertralineEntry.subst_ids,
      [],
    );
    expect(results).toEqual([]);
  });

  it("returns no duplicate results", async () => {
    const results = await lookupInteractions(
      ibuprofeneEntry.subst_ids,
      ibuprofeneEntry.class_ids,
      sertralineEntry.subst_ids,
      sertralineEntry.class_ids,
    );
    const keys = results.map(
      (r) => `${r.niveau}|${r.risque}|${r.conduite}|${r.commentaire}`
    );
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(results.length);
  });

  it("populates class name fields for a class-based slot", async () => {
    const results = await lookupInteractions(
      pamplemousseEntry.subst_ids,
      pamplemousseEntry.class_ids,
      simvastatineEntry.subst_ids,
      simvastatineEntry.class_ids,
    );
    // pamplemousse is a pure class — subst1_class_name should be populated
    const withClassName = results.find((r) => r.subst1_class_name !== null);
    expect(withClassName).toBeDefined();
  });
});
