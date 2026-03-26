import { describe, it, expect, vi, beforeAll } from "vitest";
import nock from "nock";
import { getOpenSearchResults, getOpenSearchSectionResults } from "@/db/utils/searchOpenSearch";
import { detectQueryIntent, stripIntentFromQuery, stripSpecialiteFromQuery } from "@/db/utils/searchIntent";

vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));
vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));

beforeAll(() => {
  // This is an integration test — allow all network connections
  nock.enableNetConnect();
});

/** Simulates the query pipeline from page.tsx */
async function runSearchPipeline(search: string) {
  const intent = detectQueryIntent(search);
  const medicationQuery = intent ? stripIntentFromQuery(search, intent) : search;
  const sectionQuery = intent && medicationQuery ? stripSpecialiteFromQuery(search, medicationQuery) : search;
  const results = await getOpenSearchResults(medicationQuery);
  const cisCodes = results.map((r) => r.cisCode);
  const sectionResults = cisCodes.length > 0
    ? await getOpenSearchSectionResults(sectionQuery, cisCodes, intent ?? undefined)
    : [];
  return { results, sectionResults, intent, medicationQuery, sectionQuery };
}

// ---------------------------------------------------------------------------
// Test 1 — "doliprane"
// ---------------------------------------------------------------------------
describe('"doliprane"', () => {
  it('should return Doliprane 100 mg suppositoire sécable (CIS 66057393) in results', async () => {
    const { results } = await runSearchPipeline("doliprane");
    const cis = results.find((r) => r.cisCode === "66057393");
    expect(cis).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 2 — "migraine" / "mal de tête"
// Expected: medications in ATC class N02 (anti-douleur)
// Note: pathologies are not returned in SearchResultItemV2, so we assert on atc2Label
// ---------------------------------------------------------------------------
describe('"migraine"', () => {
  it('should return anti-douleur medications (ATC N02 → atc2Label "anti-douleur")', async () => {
    const { results } = await runSearchPipeline("migraine");
    expect(results.length).toBeGreaterThan(0);
    const hasAntiDouleur = results.some((r) => /anti-douleur/i.test(r.atc2Label ?? ""));
    expect(hasAntiDouleur).toBe(true);
  });
});

describe('"mal de tête"', () => {
  it('should return anti-douleur medications (ATC N02 → atc2Label "anti-douleur")', async () => {
    const { results } = await runSearchPipeline("mal de tête");
    expect(results.length).toBeGreaterThan(0);
    const hasAntiDouleur = results.some((r) => /anti-douleur/i.test(r.atc2Label ?? ""));
    expect(hasAntiDouleur).toBe(true);
  });

  it('"mal de tête quel médicament" should also return anti-douleur medications', async () => {
    const { results } = await runSearchPipeline("mal de tête quel médicament");
    expect(results.length).toBeGreaterThan(0);
    const hasAntiDouleur = results.some((r) => /anti-douleur/i.test(r.atc2Label ?? ""));
    expect(hasAntiDouleur).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 3 — "comment en finir" (blacklisted query)
// Expected: the pipeline should flag safety-sensitive queries
// TODO: implement a blacklist mechanism in the search pipeline
// ---------------------------------------------------------------------------
describe('"comment en finir"', () => {
  it('should be flagged as a blacklisted query', async () => {
    const { isBlacklisted } = await runSearchPipeline("comment en finir");
    expect(isBlacklisted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — "doliprane enfant"
// Expected: Doliprane 1000mg (CIS 60234100) should NOT appear (not suitable for children)
// ---------------------------------------------------------------------------
describe('"doliprane enfant"', () => {
  it('should not return Doliprane 1000mg (CIS 60234100)', async () => {
    const { results } = await runSearchPipeline("doliprane enfant");
    const doli1000 = results.find((r) => r.cisCode === "60234100");
    expect(doli1000).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Test 5 — "doliprane combien ?"
// Expected: posologie section of Doliprane 100 mg suppositoire sécable (CIS 66057393)
// ---------------------------------------------------------------------------
describe('"doliprane combien ?"', () => {
  it('should surface the posologie section of Doliprane 100 mg suppositoire sécable (CIS 66057393)', async () => {
    const pipeline = await runSearchPipeline("doliprane combien ?");
    console.log("medicationQuery:", pipeline.medicationQuery);
    console.log("sectionQuery:", pipeline.sectionQuery);
    console.log("sectionResults:", pipeline.sectionResults.map(r => `${r.cisCode} / ${r.sectionTitle}`));
    const section = pipeline.sectionResults.find(
      (r) => r.cisCode === "66057393" && r.sectionAnchor === "Ann3bCommentPrendre"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 6 — "paracétamol combien"
// Expected: Ann3bCommentPrendre sections for medications whose substance is paracetamol
// ---------------------------------------------------------------------------
describe('"paracétamol combien"', () => {
  it('should surface Ann3bCommentPrendre sections only for paracetamol medications', async () => {
    const { results, sectionResults } = await runSearchPipeline("paracétamol combien");
    const paracetamolCisCodes = new Set(
      results
        .filter((r) => /paracétamol/i.test(r.composants))
        .map((r) => r.cisCode)
    );
    const posologieSections = sectionResults.filter(
      (r) => r.sectionAnchor === "Ann3bCommentPrendre" && paracetamolCisCodes.has(r.cisCode)
    );
    expect(posologieSections.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Test 7 — "migraine doliprane dose"
// Expected: Doliprane in medication results + posologie (Ann3bCommentPrendre)
// and indication (Ann3bQuestceque) sections for Doliprane
// ---------------------------------------------------------------------------
describe('"migraine doliprane dose"', () => {
  it('should return Doliprane medications', async () => {
    const { results } = await runSearchPipeline("migraine doliprane dose");
    const doliprane = results.find((r) => /doliprane/i.test(r.specName));
    expect(doliprane).toBeDefined();
  });

  it('should surface posologie sections for Doliprane', async () => {
    const { results, sectionResults } = await runSearchPipeline("migraine doliprane dose");
    const doliCisCodes = new Set(results.filter((r) => /doliprane/i.test(r.specName)).map((r) => r.cisCode));
    const posologie = sectionResults.find(
      (r) => doliCisCodes.has(r.cisCode) && r.sectionAnchor === "Ann3bCommentPrendre"
    );
    expect(posologie).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 9 — "paracétamol"
// Expected: paracetamol-only medications appear, paracetamol+codeine should NOT
// ---------------------------------------------------------------------------
describe('"paracétamol"', () => {
  it('should return medications containing paracetamol', async () => {
    const { results } = await runSearchPipeline("paracétamol");
    const hasParacetamol = results.some((r) => /paracétamol/i.test(r.composants));
    expect(hasParacetamol).toBe(true);
  });

  it('should not return Codoliprane adulte (paracetamol+codeine, CIS 64406362)', async () => {
    const { results } = await runSearchPipeline("paracétamol");
    const codoliprane = results.find((r) => r.cisCode === "64406362");
    expect(codoliprane).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Test 10 — "antibiotique effet indésirable"
// Expected: antibiotic medications + Ann3bEffetsIndesirables sections for them
// ---------------------------------------------------------------------------
describe('"antibiotique effet indésirable"', () => {
  it('should return Augmentin (CIS 66853013) in medication results', async () => {
    const { results } = await runSearchPipeline("antibiotique effet indésirable");
    const augmentin = results.find((r) => r.cisCode === "66853013");
    expect(augmentin).toBeDefined();
  });

  it('should surface Ann3bEffetsIndesirables section for Augmentin (CIS 66853013)', async () => {
    const { sectionResults } = await runSearchPipeline("antibiotique effet indésirable");
    const section = sectionResults.find(
      (r) => r.cisCode === "66853013" && r.sectionAnchor === "Ann3bEffetsIndesirables"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 11 — "clamoxyl générique"
// Expected: Clamoxyl (CIS 64539416) + its generics (CIS 60101406, 64470824) in results
// ---------------------------------------------------------------------------
describe('"clamoxyl générique"', () => {
  it('should return Clamoxyl (CIS 64539416)', async () => {
    const { results } = await runSearchPipeline("clamoxyl générique");
    const clamoxyl = results.find((r) => r.cisCode === "64539416");
    expect(clamoxyl).toBeDefined();
  });

  it('should return generics of Clamoxyl (CIS 60101406, 64470824)', async () => {
    const { results } = await runSearchPipeline("clamoxyl générique");
    const cisCodes = results.map((r) => r.cisCode);
    expect(cisCodes).toContain("60101406");
    expect(cisCodes).toContain("64470824");
  });
});

// ---------------------------------------------------------------------------
// Test 12 — "générique"
// Expected: redirect to generics page (not a medication search)
// TODO: implement a generics redirect mechanism in the search pipeline
// ---------------------------------------------------------------------------
describe('"générique"', () => {
  it('should be flagged as a generics redirect query', async () => {
    const { isGenericsRedirect } = await runSearchPipeline("générique");
    expect(isGenericsRedirect).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 13 — "doliprane 1000mg"
// Expected: Doliprane 1000mg (CIS 60234100) appears, other Doliprane dosages do not
// ---------------------------------------------------------------------------
describe('"doliprane 1000mg"', () => {
  it('should return Doliprane 1000mg (CIS 60234100)', async () => {
    const { results } = await runSearchPipeline("doliprane 1000mg");
    const doli1000 = results.find((r) => r.cisCode === "60234100");
    expect(doli1000).toBeDefined();
  });

  it('should not return Doliprane 100mg suppositoire sécable (CIS 66057393)', async () => {
    const { results } = await runSearchPipeline("doliprane 1000mg");
    const doli100 = results.find((r) => r.cisCode === "66057393");
    expect(doli100).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Test 14 — "doliprane gélule"
// Expected: Doliprane gélule forms (CIS 69309629, 67119691) appear,
// Doliprane suppositoire (CIS 66057393) does not
// ---------------------------------------------------------------------------
describe('"doliprane gélule"', () => {
  it('should return Doliprane gélule forms (CIS 69309629, 67119691)', async () => {
    const { results } = await runSearchPipeline("doliprane gélule");
    const cisCodes = results.map((r) => r.cisCode);
    expect(cisCodes).toContain("69309629");
    expect(cisCodes).toContain("67119691");
  });

  it('should not return Doliprane suppositoire sécable (CIS 66057393)', async () => {
    const { results } = await runSearchPipeline("doliprane gélule");
    const suppositoire = results.find((r) => r.cisCode === "66057393");
    expect(suppositoire).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Test 15 — "complément alimentaire"
// Expected: no results (not a medication)
// ---------------------------------------------------------------------------
describe('"complément alimentaire"', () => {
  it('should return no results', async () => {
    const { results } = await runSearchPipeline("complément alimentaire");
    expect(results).toHaveLength(0);
  });
});
