import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { readFileSync } from "node:fs";
import overBudgetSelection from "@/testsUtils/fixtures/notice-64720167-over-budget-selection.json";
vi.mock("server-only", () => ({}));
vi.mock("@/db/utils/notice", () => ({ getNotice: vi.fn() }));
import { getNotice } from "@/db/utils/notice";
import { GET } from "./route";
import { prepareNoticePassages } from "@/lib/noticePassages";
import { parse } from "node-html-parser";

const html =
  '<h2 id="taking">Utilisation</h2><p>Restriction générale.</p><h3 id="children">Enfants</h3><p>Instructions pédiatriques complètes.</p><h2>Avertissements</h2><p>Autre restriction.</p>';
const fetchMock = vi.fn();
const run = (questionId = "pediatrie") =>
  GET(
    new NextRequest(
      `http://localhost/medicaments/test-69636399/notice-search?question=${encodeURIComponent(questionId)}`,
    ),
    { params: Promise.resolve({ slug: "test-69636399" }) },
  );
function modelResponse(content: unknown, finish_reason = "stop") {
  fetchMock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          choices: [
            { finish_reason, message: { content: JSON.stringify(content) } },
          ],
        }),
        { status: 200 },
      ),
  );
}

beforeEach(() => {
  vi.mocked(getNotice).mockResolvedValue({
    codeCIS: 69636399,
    title: "Test",
    dateNotif: "",
    contentHtml: html,
  });
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("notice selection endpoint", () => {
  it.each([
    ["description", "Ann3bQuestceque"],
    ["commentPrendre", "Ann3bCommentPrendre"],
    ["effetsIndesirables", "Ann3bEffetsIndesirables"],
    ["conservation", "Ann3bConservation"],
    ["contenu", "Ann3bEmballage"],
  ])(
    "returns the %s section as an answer without calling Albert",
    async (questionId, anchor) => {
      vi.mocked(getNotice).mockResolvedValue({
        codeCIS: 60234100,
        title: "NOTICE",
        dateNotif: "",
        contentHtml: `<h2 id="${anchor}">Rubrique officielle</h2><p>Premier paragraphe.</p><p>Second paragraphe.</p><h2 id="other">Autre rubrique</h2><p>À exclure.</p>`,
      });
      const body = await (await run(questionId)).json();
      expect(body.status).toBe("supported");
      expect(body.passages[0].target.anchor).toBe(anchor);
      expect(body.passages[0].quotes[0].html).toContain("Premier paragraphe.");
      expect(body.passages[0].quotes[0].html).toContain("Second paragraphe.");
      expect(body.passages[0].quotes[0].html).not.toContain("À exclure.");
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("uses the predefined fallback query when the expected section anchor is absent", async () => {
    modelResponse({ status: "insufficient_evidence", selections: [] });
    expect((await run("contenu")).status).toBe(200);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(JSON.parse(request.messages[1].content).question).toBe(
      "Quelle est la composition de ce médicament ?",
    );
  });

  it("quotes the composition subsection instead of the unrelated packaging and manufacturer details", async () => {
    vi.mocked(getNotice).mockResolvedValue({
      codeCIS: 60234100,
      title: "NOTICE",
      dateNotif: "",
      contentHtml:
        '<h2 id="Ann3bEmballage">Contenu et autres informations</h2><h3 id="composition">Ce que contient ce médicament</h3><p>Composition officielle.</p><h3>Fabricant</h3><p>Adresse du fabricant.</p>',
    });
    const body = await (await run("contenu")).json();
    expect(body.passages[0].target.anchor).toBe("composition");
    expect(body.passages[0].quotes[0].html).toContain(
      "Composition officielle.",
    );
    expect(body.passages[0].quotes[0].html).not.toContain(
      "Adresse du fabricant.",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects custom questions instead of forwarding them to Albert", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/medicaments/test-69636399/notice-search?q=Question%20personnalis%C3%A9e",
      ),
      { params: Promise.resolve({ slug: "test-69636399" }) },
    );
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await run("__proto__")).status).toBe(400);
  });
  it("returns the CIS 60234100 dosage table without attaching its long introduction", async () => {
    const source = readFileSync(
      "src/testsUtils/fixtures/notice-60234100.html",
      "utf8",
    );
    vi.mocked(getNotice).mockResolvedValue({
      codeCIS: 60234100,
      title: "NOTICE",
      dateNotif: "",
      contentHtml: source,
    });
    const dosage = prepareNoticePassages(source).passages.find(
      (passage) => passage.target.anchor === "Ann3bCommentPrendre",
    )!;
    const table = dosage.quotes.find((quote) => quote.html.includes("<table"))!;
    modelResponse({
      status: "supported",
      selections: [{ passage_id: dosage.id, quote_ids: [table.id] }],
    });
    const response = await GET(
      new NextRequest(
        "http://localhost/medicaments/test-60234100/notice-search?question=combienPrendre",
      ),
      { params: Promise.resolve({ slug: "test-60234100" }) },
    );
    const body = await response.json();
    expect(body.status).toBe("supported");
    const visible = body.passages[0].quotes[0].html;
    expect(visible.startsWith("<table")).toBe(true);
    expect(parse(visible).structuredText.trim().split(/\s+/u).length).toBe(45);
    expect(visible).toContain("Adulte et enfant à partir de 50 kg");
    expect(visible).not.toContain("La posologie dépend du poids");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns the selected connected CIS 64720167 answer directly", async () => {
    const source = readFileSync(
      "src/testsUtils/fixtures/notice-64720167.html",
      "utf8",
    );
    vi.mocked(getNotice).mockResolvedValue({
      codeCIS: 64720167,
      title: "NOTICE",
      dateNotif: "",
      contentHtml: source,
    });
    const compact = prepareNoticePassages(source)
      .passages.find((passage) => passage.id === "passage-6")!
      .quotes.find(
        (quote) =>
          quote.html.includes("en cas de crise d’asthme ou") &&
          quote.html.includes("Cette dose peut éventuellement être répétée"),
      )!;
    modelResponse({
      status: "supported",
      selections: [
        {
          passage_id: "passage-6",
          quote_ids: [compact.id, "passage-6-quote-12"],
        },
      ],
    });
    const response = await GET(
      new NextRequest(
        "http://localhost/medicaments/test-64720167/notice-search?question=combienPrendre",
      ),
      { params: Promise.resolve({ slug: "test-64720167" }) },
    );
    const body = await response.json();
    expect(body.status).toBe("supported");
    const visible = body.passages
      .flatMap((passage: { quotes: { html: string }[] }) =>
        passage.quotes.map((quote) => quote.html),
      )
      .join(" ");
    expect(visible).toContain("inhalez 1 à 2 bouffées");
    expect(visible).toContain("Cette dose peut éventuellement être répétée");
    expect(visible).toContain("Si les troubles ne régressent pas rapidement");
    expect(
      parse(visible).structuredText.trim().split(/\s+/u).length,
    ).toBeLessThanOrEqual(70);
    expect(visible).not.toContain("prévention de l’asthme d’effort");
    expect(visible).not.toContain("En cas de crise d'asthme sévère");
    expect(body.passages[0].quotes).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("returns server-resolved excerpts with context, never an answer written by the model", async () => {
    modelResponse({
      status: "supported",
      selections: [
        { passage_id: "passage-2", quote_ids: ["passage-2-quote-2"] },
        { passage_id: "passage-3", quote_ids: ["passage-3-quote-1"] },
      ],
    });
    const body = await (await run()).json();
    expect(body.status).toBe("supported");
    expect(body.sourceVersion).toMatch(/^[a-f0-9]{64}$/);
    expect(body.passages).toHaveLength(2);
    expect(body.passages[0].html).toContain("Restriction générale.");
    expect(body.passages[0].html).toContain(
      "Instructions pédiatriques complètes.",
    );
    expect(body.passages[0].quotes).toHaveLength(1);
    expect(body.passages[0].quotes[0].html).toBe(
      "<p>Instructions pédiatriques complètes.</p>",
    );
    expect(body.passages[0].quotes[0].headingPath).toEqual([
      "Utilisation",
      "Enfants",
    ]);
    expect(body).not.toHaveProperty("answer");
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.messages[0].role).toBe("system");
    const input = JSON.parse(request.messages[1].content);
    const sourceQuotes = input.passages.flatMap(
      (passage: { quotes: { html: string }[] }) =>
        passage.quotes.map((quote) => quote.html),
    );
    expect(sourceQuotes).toEqual([
      "<p>Restriction générale.</p>",
      "<p>Instructions pédiatriques complètes.</p>",
      "<p>Autre restriction.</p>",
    ]);
  });

  it("reports insufficient evidence separately from errors", async () => {
    modelResponse({ status: "insufficient_evidence", selections: [] });
    expect(await (await run()).json()).toEqual({
      status: "insufficient_evidence",
      passages: [],
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts several verified quotes without imposing a quote-count cap", async () => {
    vi.mocked(getNotice).mockResolvedValue({
      codeCIS: 69636399,
      title: "Test",
      dateNotif: "",
      contentHtml:
        "<h2>Précautions</h2>" +
        Array.from(
          { length: 5 },
          (_, index) => `<p>Condition ${index + 1}.</p>`,
        ).join(""),
    });
    modelResponse({
      status: "supported",
      selections: [
        {
          passage_id: "passage-1",
          quote_ids: Array.from(
            { length: 5 },
            (_, index) => `passage-1-quote-${index + 1}`,
          ),
        },
      ],
    });
    const response = await run();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("supported");
    expect(body.passages[0].quotes).toHaveLength(5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates repeated source identifiers", async () => {
    modelResponse({
      status: "supported",
      selections: [
        {
          passage_id: "passage-2",
          quote_ids: Array(7).fill("passage-2-quote-2"),
        },
      ],
    });
    const response = await run();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("supported");
    expect(body.passages[0].quotes).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not reject a verified selection because of its length", async () => {
    vi.mocked(getNotice).mockResolvedValue({
      codeCIS: 64720167,
      title: "NOTICE",
      dateNotif: "",
      contentHtml: readFileSync(
        "src/testsUtils/fixtures/notice-64720167.html",
        "utf8",
      ),
    });
    modelResponse(overBudgetSelection);
    const response = await run();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe("supported");
    expect(body.passages[0].quotes.length).toBeGreaterThan(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    {
      status: "supported",
      selections: [
        {
          passage_id: "passage-2",
          quote_ids: ["passage-2-quote-2", "invented"],
        },
      ],
    },
    {
      status: "supported",
      selections: [
        { passage_id: "passage-2", quote_ids: ["passage-2-quote-2"] },
      ],
      answer: "An invented answer",
    },
    { status: "supported", selections: [] },
  ])("fails closed on an invalid selection: %j", async (content) => {
    modelResponse(content);
    const response = await run();
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ status: "error", passages: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects truncated output even if its JSON parses", async () => {
    modelResponse(
      {
        status: "supported",
        selections: [
          { passage_id: "passage-2", quote_ids: ["passage-2-quote-2"] },
        ],
      },
      "length",
    );
    expect((await run()).status).toBe(502);
  });

  it("reports a network failure without returning medical text", async () => {
    fetchMock.mockRejectedValue(new Error("Network failure"));
    expect(await (await run()).json()).toEqual({
      status: "error",
      passages: [],
    });
  });

  it("does not call the model when the leaflet is unavailable", async () => {
    vi.mocked(getNotice).mockResolvedValue(undefined);
    expect(await (await run()).json()).toEqual({
      status: "unavailable",
      passages: [],
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unknown preset questions", async () => {
    expect((await run("  ")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
