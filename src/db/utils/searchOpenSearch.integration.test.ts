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

// ---------------------------------------------------------------------------
// Test 16 — "migraine pourquoi"
// Expected: medications for pathology migraine (ATC N02, atc2Label "anti-douleur")
// Note: articles not yet implemented in v2 pipeline
// ---------------------------------------------------------------------------
describe('"migraine pourquoi"', () => {
  it('should return anti-douleur medications (ATC N02)', async () => {
    const { results } = await runSearchPipeline("migraine pourquoi");
    expect(results.length).toBeGreaterThan(0);
    const hasAntiDouleur = results.some((r) => /anti-douleur/i.test(r.atc2Label ?? ""));
    expect(hasAntiDouleur).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 17 — "brûlure bras"
// Expected: dermatology/skin medications — Biafine (CIS 69931588) should appear
// ---------------------------------------------------------------------------
describe('"brûlure bras"', () => {
  it('should return Biafine (CIS 69931588)', async () => {
    const { results } = await runSearchPipeline("brûlure bras");
    const biafine = results.find((r) => r.cisCode === "69931588");
    expect(biafine).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 18 — "surdosage"
// Expected: safety/prevention message shown to the user
// TODO: implement a safety message mechanism in the search pipeline
// ---------------------------------------------------------------------------
describe('"surdosage"', () => {
  it('should be flagged as a safety message query', async () => {
    const { isSafetyMessage } = await runSearchPipeline("surdosage");
    expect(isSafetyMessage).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 19 — "douleur effet secondaire ibuprofène"
// Expected: ibuprofène medications + Ann3bEffetsIndesirables sections for them
// ---------------------------------------------------------------------------
describe('"douleur effet secondaire ibuprofène"', () => {
  it('should return Advil (CIS 68634000) in medication results', async () => {
    const { results } = await runSearchPipeline("douleur effet secondaire ibuprofène");
    const advil = results.find((r) => r.cisCode === "68634000");
    expect(advil).toBeDefined();
  });

  it('should surface Ann3bEffetsIndesirables section for Advil (CIS 68634000)', async () => {
    const { sectionResults } = await runSearchPipeline("douleur effet secondaire ibuprofène");
    const section = sectionResults.find(
      (r) => r.cisCode === "68634000" && r.sectionAnchor === "Ann3bEffetsIndesirables"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 20 — "effets secondaires amoxicilline"
// Expected: Ann3bEffetsIndesirables sections for amoxicillin medications
// ---------------------------------------------------------------------------
describe('"effets secondaires amoxicilline"', () => {
  it('should return Augmentin (CIS 66853013) in medication results', async () => {
    const { results } = await runSearchPipeline("effets secondaires amoxicilline");
    const augmentin = results.find((r) => r.cisCode === "66853013");
    expect(augmentin).toBeDefined();
  });

  it('should surface Ann3bEffetsIndesirables section for Augmentin (CIS 66853013)', async () => {
    const { sectionResults } = await runSearchPipeline("effets secondaires amoxicilline");
    const section = sectionResults.find(
      (r) => r.cisCode === "66853013" && r.sectionAnchor === "Ann3bEffetsIndesirables"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 21 — "zovirax herpes dose"
// Expected: Ann3bCommentPrendre section for Zovirax (CIS 68670676)
// ---------------------------------------------------------------------------
describe('"zovirax herpes dose"', () => {
  it('should return Zovirax (CIS 68670676) in medication results', async () => {
    const { results } = await runSearchPipeline("zovirax herpes dose");
    const zovirax = results.find((r) => r.cisCode === "68670676");
    expect(zovirax).toBeDefined();
  });

  it('should surface Ann3bCommentPrendre section for Zovirax (CIS 68670676)', async () => {
    const { sectionResults } = await runSearchPipeline("zovirax herpes dose");
    const section = sectionResults.find(
      (r) => r.cisCode === "68670676" && r.sectionAnchor === "Ann3bCommentPrendre"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 22 — "dose enfant antidouleur"
// Expected: antidouleur medications (ATC N02) excluding those with pediatric alerts
// + Ann3bCommentPrendre sections for remaining results
// ---------------------------------------------------------------------------
describe('"dose enfant antidouleur"', () => {
  it('should return antidouleur medications (ATC N02)', async () => {
    const { results } = await runSearchPipeline("dose enfant antidouleur");
    expect(results.length).toBeGreaterThan(0);
    const hasAntiDouleur = results.some((r) => /anti-douleur/i.test(r.atc2Label ?? ""));
    expect(hasAntiDouleur).toBe(true);
  });

  it('should not return medications with pediatric alerts', async () => {
    const { results } = await runSearchPipeline("dose enfant antidouleur");
    const withPediatricAlert = results.find((r) => !!r.alerts?.pediatrics);
    expect(withPediatricAlert).toBeUndefined();
  });

  it('should surface Ann3bCommentPrendre sections for returned medications', async () => {
    const { results, sectionResults } = await runSearchPipeline("dose enfant antidouleur");
    const cisCodes = new Set(results.map((r) => r.cisCode));
    const posologie = sectionResults.find(
      (r) => cisCodes.has(r.cisCode) && r.sectionAnchor === "Ann3bCommentPrendre"
    );
    expect(posologie).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 23 — "durée traitement amoxicilline"
// Expected: amoxicillin medications + Ann3bCommentPrendre ("comment le prendre") sections
// ---------------------------------------------------------------------------
describe('"durée traitement amoxicilline"', () => {
  it('should return Augmentin (CIS 66853013) in medication results', async () => {
    const { results } = await runSearchPipeline("durée traitement amoxicilline");
    const augmentin = results.find((r) => r.cisCode === "66853013");
    expect(augmentin).toBeDefined();
  });

  it('should surface Ann3bCommentPrendre section for Augmentin (CIS 66853013)', async () => {
    const { sectionResults } = await runSearchPipeline("durée traitement amoxicilline");
    const section = sectionResults.find(
      (r) => r.cisCode === "66853013" && r.sectionAnchor === "Ann3bCommentPrendre"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 24 — "pharmacie de garde"
// Expected: redirect to https://pharmacie-de-garde.ameli.fr/
// TODO: implement external redirect mechanism in the search pipeline
// ---------------------------------------------------------------------------
describe('"pharmacie de garde"', () => {
  it('should be flagged as an external redirect query', async () => {
    const { isExternalRedirect } = await runSearchPipeline("pharmacie de garde");
    expect(isExternalRedirect).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 25 — "surdosage enfant que faire"
// Expected: safety message ("Appelez votre médecin")
// TODO: implement a safety message mechanism in the search pipeline
// ---------------------------------------------------------------------------
describe('"surdosage enfant que faire"', () => {
  it('should be flagged as a safety message query', async () => {
    const { isSafetyMessage } = await runSearchPipeline("surdosage enfant que faire");
    expect(isSafetyMessage).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 26 — "danger vaccin"
// Expected: vaccine medications + Ann3bEffetsIndesirables sections
// ---------------------------------------------------------------------------
describe('"danger vaccin"', () => {
  it('should return a known vaccine (CIS 61077869) in medication results', async () => {
    const { results } = await runSearchPipeline("danger vaccin");
    const vaccin = results.find((r) => r.cisCode === "61077869");
    expect(vaccin).toBeDefined();
  });

  it('should surface Ann3bEffetsIndesirables section for the vaccine (CIS 61077869)', async () => {
    const { sectionResults } = await runSearchPipeline("danger vaccin");
    const section = sectionResults.find(
      (r) => r.cisCode === "61077869" && r.sectionAnchor === "Ann3bEffetsIndesirables"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 27 — "enfant danger doliprane"
// Expected: Ann3bCommentPrendre section for Doliprane 100 mg suppositoire sécable (CIS 66057393)
// ---------------------------------------------------------------------------
describe('"enfant danger doliprane"', () => {
  it('should surface Ann3bCommentPrendre section for Doliprane 100 mg suppositoire sécable (CIS 66057393)', async () => {
    const { sectionResults } = await runSearchPipeline("enfant danger doliprane");
    const section = sectionResults.find(
      (r) => r.cisCode === "66057393" && r.sectionAnchor === "Ann3bCommentPrendre"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests 28 & 36 — drug interaction queries
// Expected: pipeline flags queries involving two medications as drug interactions
// TODO: implement drug interaction search in the pipeline
// ---------------------------------------------------------------------------
describe('drug interaction queries', () => {
  it('"doliprane ibuprofène" should be flagged as a drug interaction query', async () => {
    const { isDrugInteraction } = await runSearchPipeline("doliprane ibuprofène");
    expect(isDrugInteraction).toBe(true);
  });

  it('"doliprane antibiotique" should be flagged as a drug interaction query', async () => {
    const { isDrugInteraction } = await runSearchPipeline("doliprane antibiotique");
    expect(isDrugInteraction).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 29 — "xanax conduire"
// Expected: RcpConduite section for Xanax (CIS 60647049)
// ---------------------------------------------------------------------------
describe('"xanax conduire"', () => {
  it('should return Xanax (CIS 60647049) in medication results', async () => {
    const { results } = await runSearchPipeline("xanax conduire");
    const xanax = results.find((r) => r.cisCode === "60647049");
    expect(xanax).toBeDefined();
  });

  it('should surface RcpConduite section for Xanax (CIS 60647049)', async () => {
    const { sectionResults } = await runSearchPipeline("xanax conduire");
    const section = sectionResults.find(
      (r) => r.cisCode === "60647049" && r.sectionAnchor === "RcpConduite"
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 30 — "enceinte ibuprofène"
// Expected: grossesse/contre-indication sections for ibuprofène medications
// ---------------------------------------------------------------------------
describe('"enceinte ibuprofène"', () => {
  it('should return Advil (CIS 68634000) in medication results', async () => {
    const { results } = await runSearchPipeline("enceinte ibuprofène");
    const advil = results.find((r) => r.cisCode === "68634000");
    expect(advil).toBeDefined();
  });

  it('should surface RcpFertGrossAllait or Ann3bInfoNecessaires section for Advil (CIS 68634000)', async () => {
    const { sectionResults } = await runSearchPipeline("enceinte ibuprofène");
    const section = sectionResults.find(
      (r) => r.cisCode === "68634000" &&
        (r.sectionAnchor === "RcpFertGrossAllait" || r.sectionAnchor === "Ann3bInfoNecessaires")
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 31 — "alcool danger anxiolitique"
// Note: "anxiolitique" is a misspelling of "anxiolytique" — this test also validates
// robustness to common misspellings in medication class names
// Expected: anxiolytic medications + RcpInteractionsMed/RcpMisesEnGarde/Ann3bInfoNecessaires sections
// ---------------------------------------------------------------------------
describe('"alcool danger anxiolitique"', () => {
  it('should return a known anxiolytic (CIS 66925605) in medication results', async () => {
    const { results } = await runSearchPipeline("alcool danger anxiolitique");
    const anxiolytic = results.find((r) => r.cisCode === "66925605");
    expect(anxiolytic).toBeDefined();
  });

  it('should surface an alcohol-related section for the anxiolytic (CIS 66925605)', async () => {
    const { sectionResults } = await runSearchPipeline("alcool danger anxiolitique");
    const section = sectionResults.find(
      (r) => r.cisCode === "66925605" &&
        ["RcpInteractionsMed", "RcpMisesEnGarde", "Ann3bInfoNecessaires"].includes(r.sectionAnchor)
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 32 — "antidépresseur risque accoutumance"
// Expected: antidepressant medications + RcpEffetsIndesirables/Ann3bEffetsIndesirables sections
// ---------------------------------------------------------------------------
describe('"antidépresseur risque accoutumance"', () => {
  it('should return a known antidepressant (CIS 60528874) in medication results', async () => {
    const { results } = await runSearchPipeline("antidépresseur risque accoutumance");
    const antidep = results.find((r) => r.cisCode === "60528874");
    expect(antidep).toBeDefined();
  });

  it('should surface an effets indésirables section for the antidepressant (CIS 60528874)', async () => {
    const { sectionResults } = await runSearchPipeline("antidépresseur risque accoutumance");
    const section = sectionResults.find(
      (r) => r.cisCode === "60528874" &&
        ["RcpEffetsIndesirables", "Ann3bEffetsIndesirables"].includes(r.sectionAnchor)
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 33 — "antidépresseur arrêt"
// Expected: posologie sections for antidepressants
// Clomipramine Sandoz (CIS 60528874) used as reference antidepressant
// ---------------------------------------------------------------------------
describe('"antidépresseur arrêt"', () => {
  it('should return Clomipramine Sandoz (CIS 60528874) in medication results', async () => {
    const { results } = await runSearchPipeline("antidépresseur arrêt");
    const clomipramine = results.find((r) => r.cisCode === "60528874");
    expect(clomipramine).toBeDefined();
  });

  it('should surface a posologie section for Clomipramine Sandoz (CIS 60528874)', async () => {
    const { sectionResults } = await runSearchPipeline("antidépresseur arrêt");
    const section = sectionResults.find(
      (r) => r.cisCode === "60528874" &&
        ["RcpPosoAdmin", "Ann3bCommentPrendre"].includes(r.sectionAnchor)
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 34 — "déroxat risque"
// Expected: effets indésirables sections for Déroxat (CIS 60160707)
// ---------------------------------------------------------------------------
describe('"déroxat risque"', () => {
  it('should return Déroxat (CIS 60160707) in medication results', async () => {
    const { results } = await runSearchPipeline("déroxat risque");
    const deroxat = results.find((r) => r.cisCode === "60160707");
    expect(deroxat).toBeDefined();
  });

  it('should surface an effets indésirables section for Déroxat (CIS 60160707)', async () => {
    const { sectionResults } = await runSearchPipeline("déroxat risque");
    const section = sectionResults.find(
      (r) => r.cisCode === "60160707" &&
        ["RcpEffetsIndesirables", "Ann3bEffetsIndesirables"].includes(r.sectionAnchor)
    );
    expect(section).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Test 35 — "prosac anxiolitique ?"
// Note: "prosac" is a misspelling of "Prozac" — this test also validates
// robustness to common misspellings in medication names
// Expected: indication section (RcpIndicTherap) for Prozac (CIS 61885224)
// ---------------------------------------------------------------------------
describe('"prosac anxiolitique ?"', () => {
  it('should return Prozac (CIS 61885224) despite the misspelling "prosac"', async () => {
    const { results } = await runSearchPipeline("prosac anxiolitique ?");
    const prozac = results.find((r) => r.cisCode === "61885224");
    expect(prozac).toBeDefined();
  });

  it('should surface RcpIndicTherap section for Prozac (CIS 61885224)', async () => {
    const { sectionResults } = await runSearchPipeline("prosac anxiolitique ?");
    const section = sectionResults.find(
      (r) => r.cisCode === "61885224" && r.sectionAnchor === "RcpIndicTherap"
    );
    expect(section).toBeDefined();
  });
});
