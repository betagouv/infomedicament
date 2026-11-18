import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "node-html-parser";
vi.mock("server-only", () => ({}));
import {
  getSelectableNoticeQuotes,
  parseNoticeSelection,
  prepareNoticePassages,
  resolveNoticeSelection,
} from "./noticePassages";

const leaflet = `<div><h1>NOTICE — Médicament de test</h1>
<p>Consultez les restrictions avant utilisation.</p>
<h2 id="taking">Comment le prendre ?</h2>
<p>La prise dépend de l’âge et du poids. Ne dépassez pas les limites indiquées.</p>
<div><h3 id="adults">Adultes</h3><p>Instructions réservées aux adultes.</p></div>
<div><h3 id="children">Enfants</h3><p>Respectez les tranches du tableau.</p>
<table><caption>Tranches de poids</caption><thead><tr><th>Poids</th><th>Instructions</th></tr></thead>
<tbody><tr><td>Tranche A</td><td><b>Voir prescription</b></td></tr><tr><td>Tranche B</td><td>Voir prescription</td></tr></tbody></table>
<p>Note : une restriction s’applique à toutes les lignes.</p><ul><li>Première condition</li><li>Deuxième condition</li></ul></div>
<h2 id="warnings">Avertissements</h2><p>Restriction complémentaire à consulter.</p></div>`;

const prepare = () => prepareNoticePassages(leaflet);

describe("context-preserving leaflet passages", () => {
  it("keeps ancestor introductions, the full pediatric table, notes and lists together", () => {
    const { passages } = prepare();
    const child = passages.find(
      (passage) => passage.headingPath.at(-1) === "Enfants",
    )!;
    expect(child.headingPath).toEqual([
      "NOTICE — Médicament de test",
      "Comment le prendre ?",
      "Enfants",
    ]);
    for (const text of [
      "Consultez les restrictions",
      "La prise dépend",
      "Tranche A",
      "Tranche B",
      "Note :",
      "Première condition",
      "Deuxième condition",
      "<thead>",
      "<caption>",
    ]) {
      expect(child.html).toContain(text);
    }
    expect(child.html).not.toContain("Instructions réservées aux adultes");
    expect(child.target).toEqual({ anchor: "children", blockId: undefined });
  });

  it("offers the full parent section when the needed context exceeds a subsection", () => {
    const parent = prepare().passages.find(
      (passage) => passage.headingPath.at(-1) === "Comment le prendre ?",
    )!;
    expect(parent.html).toContain("Instructions réservées aux adultes");
    expect(parent.html).toContain("une restriction s’applique");
    expect(parent.html).not.toContain("Restriction complémentaire");
  });

  it("retains an ambiguous bold subsection and its surrounding conditions in one section", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Utilisation</h2><p>Restriction générale.</p><p><b>Enfants</b></p><p>Instructions.</p><p>Exception.</p>",
    );
    expect(passages).toHaveLength(1);
    expect(passages[0].html).toContain("Restriction générale.");
    expect(passages[0].html).toContain("Exception.");
  });

  it("supports legacy headings and anchors and retains unstructured documents intact", () => {
    const legacy = prepareNoticePassages(
      '<p class="AmmNoticeTitre1"><a name="taking">Prise</a></p><p>Condition.</p><p class="AmmNoticeTitre2">Enfants</p><p>Instructions.</p>',
    );
    expect(legacy.passages[1].headingPath).toEqual(["Prise", "Enfants"]);
    expect(legacy.passages[1].html).toContain("Condition.");
    expect(
      prepareNoticePassages("<p>Condition.</p><p>Instructions.</p>").passages,
    ).toHaveLength(1);
  });

  it("uses distinct source anchors for duplicated legacy IDs and anchorless blocks", () => {
    const { passages } = prepareNoticePassages(
      '<h2 id="legacy" data-block-id="first">Première rubrique</h2><p>Premier texte.</p><h2 id="legacy" data-block-id="second">Deuxième rubrique</h2><p>Deuxième texte.</p><h2 data-block-id="third">Sans ancre</h2><p>Troisième texte.</p>',
    );
    expect(passages.map((passage) => passage.target.anchor)).toEqual([
      "legacy",
      "notice-block-second",
      "notice-block-third",
    ]);
    const real = prepareNoticePassages(
      readFileSync("src/testsUtils/fixtures/notice-64720167.html", "utf8"),
    );
    expect(
      real.passages.find(
        (passage) => passage.target.blockId === "document-b0185",
      )?.target.anchor,
    ).toBe("notice-block-document-b0185");
  });

  it("sanitizes copied HTML and removes duplicated source identifiers without changing medical text", () => {
    const { passages } = prepareNoticePassages(
      '<h2 id="section">Section</h2><p data-block-id="x" onclick="bad()">Texte <b>exact</b>.</p><script>bad()</script><table><tr><th scope="col">Poids</th><td colspan="2">Condition</td></tr></table>',
    );
    expect(passages[0].html).toContain('scope="col"');
    expect(passages[0].html).toContain('colspan="2"');
    expect(passages[0].html).toContain("Texte <b>exact</b>.");
    expect(passages[0].html).not.toMatch(
      /onclick|<script|data-block-id|id="section"/,
    );
  });

  it("binds source versions to content and returns no passages for an empty leaflet", () => {
    expect(prepare().sourceVersion).toBe(prepare().sourceVersion);
    expect(
      prepareNoticePassages(leaflet + "<p>Modification.</p>").sourceVersion,
    ).not.toBe(prepare().sourceVersion);
    expect(prepareNoticePassages("  ").passages).toEqual([]);
  });
});

describe("short source quotations", () => {
  it("records adjacency across paragraphs without hiding skipped sentences, images or headings", () => {
    const { passages } = prepareNoticePassages(
      '<h2>Utilisation</h2><p>Première phrase. Phrase intermédiaire.</p><p>Paragraphe suivant.</p><img src="/diagram.png" alt="Schéma"><p>Après le schéma.</p>',
    );
    const quotes = passages[0].quotes;
    expect(quotes[0].sourceRange!.end).toBe(quotes[1].sourceRange!.start);
    expect(quotes[1].sourceRange!.end).toBe(quotes[2].sourceRange!.start);
    expect(quotes[0].sourceRange!.end).toBeLessThan(
      quotes[2].sourceRange!.start,
    );
    expect(quotes[2].sourceRange!.end).toBeLessThan(
      quotes[3].sourceRange!.start,
    );
  });
  it("can select the full CIS 60234100 dosage table independently of its introduction", () => {
    const { passages } = prepareNoticePassages(
      readFileSync("src/testsUtils/fixtures/notice-60234100.html", "utf8"),
    );
    const dosage = passages.find(
      (passage) => passage.target.anchor === "Ann3bCommentPrendre",
    )!;
    const table = dosage.quotes.find((quote) => quote.html.includes("<table"))!;
    const text = parse(table.html).structuredText;
    expect(table.html.startsWith("<table")).toBe(true);
    expect(text.trim().split(/\s+/u).length).toBeLessThanOrEqual(60);
    for (const condition of [
      "Adulte et enfant à partir de 50 kg",
      "Dose maximale",
      "Intervalle entre deux doses",
      "4 heures minimum",
      "3000 mg par jour",
    ]) {
      expect(text).toContain(condition);
    }
    expect(
      resolveNoticeSelection(
        passages,
        parseNoticeSelection({
          status: "supported",
          selections: [
            {
              passage_id: dosage.id,
              quote_ids: [table.id],
            },
          ],
        }),
      ),
    ).toHaveLength(1);
    // The introductory information is still available to the selector, separately.
    expect(dosage.html).toContain(
      "La dose quotidienne de paracétamol recommandée",
    );
    expect(
      getSelectableNoticeQuotes(dosage).some(
        (quote) =>
          !quote.html.includes("<table") &&
          quote.html.includes("La dose quotidienne de paracétamol recommandée"),
      ),
    ).toBe(true);
  });
  it("offers the requested CIS 64720167 dosage and its dependent repetition as one compact source quote", () => {
    const { passages } = prepareNoticePassages(
      readFileSync("src/testsUtils/fixtures/notice-64720167.html", "utf8"),
    );
    const dosage = passages.find(
      (passage) => passage.target.anchor === "Ann3bCommentPrendre",
    )!;
    const compact = dosage.quotes.find(
      (quote) =>
        quote.html.includes("en cas de crise d’asthme ou") &&
        quote.html.includes("Cette dose peut éventuellement être répétée"),
    );
    expect(compact).toBeDefined();
    expect(compact!.html.match(/La dose recommandée est/g)).toHaveLength(1);
    expect(compact!.html).not.toContain("prévention de l’asthme d’effort");
    expect(compact!.html).not.toContain("En cas de crise d'asthme sévère");
    expect(compact!.html).not.toContain("chambre d'inhalation");
    const selectable = getSelectableNoticeQuotes(dosage);
    expect(selectable).toContain(compact);
    expect(
      selectable.filter((quote) =>
        /Cette dose peut éventuellement être répétée/u.test(quote.html),
      ),
    ).toEqual([compact]);
    expect(
      selectable.filter(
        (quote) => quote.html === "<p>La dose recommandée est :</p>",
      ),
    ).toEqual([]);
  });
  it("separates complete sentences without losing words across inline tags or entities", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Grossesse</h2><p>Première phrase sans rapport. Cette condition <b>doit être respectée</b> pendant la grossesse &amp; après. Dernière phrase.</p>",
    );
    expect(passages[0].quotes.map((quote) => quote.html)).toEqual([
      "<p>Première phrase sans rapport.</p>",
      "<p>Cette condition <b>doit être respectée</b> pendant la grossesse &amp; après.</p>",
      "<p>Dernière phrase.</p>",
    ]);
    expect(passages[0].quotes[1].headingPath).toEqual(["Grossesse"]);
  });

  it("retains the source population headings for each quote, even in a broad parent section", () => {
    const passage = prepare().passages.find(
      (passage) => passage.headingPath.at(-1) === "Comment le prendre ?",
    )!;
    const adult = passage.quotes.find((quote) =>
      quote.html.includes("Instructions réservées aux adultes"),
    )!;
    const child = passage.quotes.find((quote) =>
      quote.html.includes("Respectez les tranches"),
    )!;
    expect(adult.headingPath.at(-1)).toBe("Adultes");
    expect(child.headingPath.at(-1)).toBe("Enfants");
  });

  it("keeps a list item with its negating introduction and never offers isolated table cells", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Précautions</h2><p>Ne prenez jamais ce médicament :</p><ul><li>en cas de condition A ;</li><li>en cas de condition B.</li></ul><table><tr><th>Population</th><th>Condition</th></tr><tr><td>Groupe A</td><td>Restriction A</td></tr><tr><td>Groupe B</td><td>Restriction B</td></tr></table>",
    );
    const item = passages[0].quotes.find((quote) =>
      quote.html.includes("<li>en cas de condition B"),
    )!;
    expect(item.html).toContain("Ne prenez jamais ce médicament :");
    expect(item.html).not.toContain("en cas de condition A");
    const table = passages[0].quotes.find((quote) =>
      quote.html.includes("Restriction A"),
    )!;
    expect(table.html).toContain("<th>Population</th>");
    expect(table.html).toContain("Restriction B");
    expect(
      passages[0].quotes.some(
        (quote) => quote.html === "<td>Restriction A</td>",
      ),
    ).toBe(false);
  });

  it("retains a negation written as the first bullet when later bullets are selected", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Grossesse</h2><ul><li>Vous ne devez pas prendre ce médicament :</li><li>Si vous êtes enceinte, sauf exception.</li><li>Si vous allaitez, sauf avis médical.</li></ul>",
    );
    const passage = passages[0];
    const bullets = passage.quotes.filter((quote) =>
      quote.html.includes("Si vous"),
    );
    for (const bullet of bullets)
      expect(bullet.html).toContain("Vous ne devez pas prendre");
    const selected = resolveNoticeSelection(passages, {
      status: "supported",
      selections: [
        { passage_id: passage.id, quote_ids: bullets.map((quote) => quote.id) },
      ],
    });
    const html = selected[0].quotes.map((quote) => quote.html).join("");
    expect(html.match(/Vous ne devez pas prendre/g)).toHaveLength(1);
    expect(parse(html).querySelectorAll("li")).toHaveLength(3);
  });

  it("keeps ordered instructions complete and recognizes legacy population headings", () => {
    const { passages } = prepareNoticePassages(
      '<p class="AmmNoticeTitre1">Prise</p><p class="AmmNoticeTitre2">Enfants</p><p>Respectez les étapes :</p><ol start="2"><li>Étape A.</li><li>Étape B.</li></ol>',
    );
    const quote = passages[1].quotes.find((quote) =>
      quote.html.includes("<ol"),
    )!;
    expect(quote.headingPath).toEqual(["Prise", "Enfants"]);
    expect(quote.html).toContain('start="2"');
    expect(quote.html).toContain("Respectez les étapes :");
    expect(quote.html).toContain("Étape A.");
    expect(quote.html).toContain("Étape B.");
  });
});

describe("selection validation", () => {
  it("shows one introduction for selected bullets from the same list without adding unselected bullets", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Précautions</h2><p>Avant de prendre ce médicament, prévenez votre médecin :</p><ul><li>Condition A.</li><li>Condition non sélectionnée.</li><li>Condition B.</li></ul>",
    );
    const passage = passages[0];
    const chosen = passage.quotes.filter(
      (quote) => !quote.html.includes("non sélectionnée"),
    );
    const resolved = resolveNoticeSelection(passages, {
      status: "supported",
      selections: [
        {
          passage_id: passage.id,
          quote_ids: chosen.map((quote) => quote.id),
        },
      ],
    });
    const html = resolved[0].quotes.map((quote) => quote.html).join("");
    expect(html.match(/Avant de prendre ce médicament/g)).toHaveLength(1);
    expect(parse(html).querySelectorAll("ul")).toHaveLength(1);
    expect(
      parse(html)
        .querySelectorAll("li")
        .map((item) => item.textContent),
    ).toEqual(["Condition A.", "Condition B."]);
  });

  it("preserves separate list conditions even when their wording is identical", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Précautions</h2><p>Ne prenez jamais ce médicament :</p><ul><li>Condition A.</li><li>Condition B.</li></ul><p>Autre population :</p><p>Ne prenez jamais ce médicament :</p><ul><li>Condition C.</li></ul>",
    );
    const passage = passages[0];
    const resolved = resolveNoticeSelection(passages, {
      status: "supported",
      selections: [
        {
          passage_id: passage.id,
          quote_ids: passage.quotes
            .filter((quote) => quote.html.includes("<ul"))
            .map((quote) => quote.id),
        },
      ],
    });
    const html = resolved[0].quotes.map((quote) => quote.html).join("");
    expect(html.match(/Ne prenez jamais/g)).toHaveLength(2);
    expect(parse(html).querySelectorAll("ul")).toHaveLength(2);
  });

  it("removes duplicate copies of source fragments when their connected block is selected", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Utilisation</h2><p>Instructions :</p><ul><li>Première instruction.</li><li>Cette instruction a une condition.</li></ul><p>Restriction.</p>",
    );
    const passage = passages[0];
    const group = passage.quotes.find((quote) => quote.supersedes?.length)!;
    const restriction = passage.quotes.find(
      (quote) => quote.html === "<p>Restriction.</p>",
    )!;
    const resolved = resolveNoticeSelection(
      passages,
      parseNoticeSelection({
        status: "supported",
        selections: [
          {
            passage_id: passage.id,
            quote_ids: [group.id, ...group.supersedes!, restriction.id],
          },
        ],
      }),
    );
    expect(resolved[0].quotes).toEqual([group, restriction]);
  });
  it("allows a paragraph and a table together without imposing a word limit", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Utilisation</h2><p>" +
        "condition ".repeat(120) +
        "</p><table><tr><th>Population</th><th>Instructions</th></tr><tr><td>Population concernée</td><td>Instructions exactes.</td></tr></table>",
    );
    const passage = passages[0];
    const selection = parseNoticeSelection({
      status: "supported",
      selections: [
        {
          passage_id: passage.id,
          quote_ids: passage.quotes.map((quote) => quote.id),
        },
      ],
    });
    const resolved = resolveNoticeSelection(passages, selection);
    expect(resolved[0].quotes).toEqual(passage.quotes);
    expect(resolved[0].quotes).toHaveLength(2);
    expect(resolved[0].quotes[0].html.split("condition").length - 1).toBe(120);
    expect(resolved[0].quotes[1].html).toContain("<table");
  });
  it("resolves original quote units in source order while keeping the full context separate", () => {
    const { passages } = prepare();
    const child = passages.find(
      (passage) => passage.headingPath.at(-1) === "Enfants",
    )!;
    const answer = child.quotes.find((quote) =>
      quote.html.includes("Respectez les tranches"),
    )!;
    const warning = passages.at(-1)!;
    const selection = parseNoticeSelection({
      status: "supported",
      selections: [
        { passage_id: warning.id, quote_ids: [warning.quotes[0].id] },
        { passage_id: child.id, quote_ids: [answer.id, answer.id] },
      ],
    });
    const resolved = resolveNoticeSelection(passages, selection);
    expect(resolved.map((passage) => passage.id)).toEqual([
      child.id,
      warning.id,
    ]);
    expect(resolved[0].quotes).toEqual([answer]);
    expect(resolved[0].html).toContain("Tranche A");
    expect(resolved[0].quotes[0].html).not.toContain("Tranche A");
  });

  it("rejects the whole selection when either a passage or a quote is invented or belongs elsewhere", () => {
    const { passages } = prepare();
    expect(() =>
      resolveNoticeSelection(passages, {
        status: "supported",
        selections: [
          { passage_id: passages[0].id, quote_ids: [passages[0].quotes[0].id] },
          { passage_id: "invented", quote_ids: ["invented"] },
        ],
      }),
    ).toThrow("Unknown notice passage");
    for (const id of ["invented", passages.at(-1)!.quotes[0].id]) {
      expect(() =>
        resolveNoticeSelection(passages, {
          status: "supported",
          selections: [{ passage_id: passages[0].id, quote_ids: [id] }],
        }),
      ).toThrow("Unknown notice quote");
    }
  });

  it("preserves a longer quotation in full instead of rejecting or clipping it", () => {
    const { passages } = prepareNoticePassages(
      "<h2>Condition</h2><p>" + "mot ".repeat(201) + "</p>",
    );
    expect(
      resolveNoticeSelection(passages, {
        status: "supported",
        selections: [
          { passage_id: passages[0].id, quote_ids: [passages[0].quotes[0].id] },
        ],
      })[0].quotes,
    ).toEqual(passages[0].quotes);
    expect(passages[0].quotes[0].html.split("mot").length - 1).toBe(201);
  });

  it("preserves all verified selected passages without a source-count cap", () => {
    const { passages } = prepareNoticePassages(
      Array.from(
        { length: 4 },
        (_, index) =>
          `<h2>Section ${index + 1}</h2><p>Condition ${index + 1}.</p>`,
      ).join(""),
    );
    const selection = parseNoticeSelection({
      status: "supported",
      selections: passages.map((passage) => ({
        passage_id: passage.id,
        quote_ids: [passage.quotes[0].id],
      })),
    });
    expect(resolveNoticeSelection(passages, selection)).toHaveLength(4);
  });

  it.each([
    { status: "supported", selections: [] },
    {
      status: "insufficient_evidence",
      selections: [{ passage_id: "passage-1", quote_ids: ["quote-1"] }],
    },
    {
      status: "supported",
      selections: [{ passage_id: "passage-1", quote_ids: [1] }],
    },
    {
      status: "supported",
      selections: [{ passage_id: "passage-1", quote_ids: [] }],
    },
    {
      status: "supported",
      selections: [{ passage_id: "passage-1", quote_ids: ["quote-1"] }],
      answer: "Generated prose",
    },
    { answer: "Generated prose" },
    null,
  ])("rejects malformed or free-text responses: %j", (value) => {
    expect(() => parseNoticeSelection(value)).toThrow();
  });
});
