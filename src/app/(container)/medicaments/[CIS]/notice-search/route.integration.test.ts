import { describe, it, expect, vi } from "vitest";
import nock from "nock";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { NextRequest } from "next/server";
import { GET } from "./route";

const CIS = "69636399"; // DOLIPRANEVITAMINEC
const ALBERT_API = "https://albert.api.etalab.gouv.fr";

function makeRequest(q: string): NextRequest {
  return new NextRequest(`http://localhost/medicaments/${CIS}/notice-search?q=${encodeURIComponent(q)}`);
}

function makeParams(cis: string) {
  return { params: Promise.resolve({ CIS: cis }) };
}

const validAlbertResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        answer: "Ne pas dépasser la dose recommandée.",
        section_anchor: "Ann3bCommentPrendre",
        sub_header: "",
        block_id: "document-b98622",
        quote: "Ne pas dépasser la dose recommandée.",
      }),
    },
  }],
};

describe("notice-search route (integration)", () => {
  it("fetches a real notice for CIS 69636399 and returns a hit", async () => {
    nock(ALBERT_API).post("/v1/chat/completions").reply(200, validAlbertResponse);

    const res = await GET(makeRequest("Quelle est la posologie ?"), makeParams(CIS));
    const body = await res.json();

    expect(body.hits).toHaveLength(1);
    expect(body.hits[0].answer).toBe("Ne pas dépasser la dose recommandée.");
    expect(body.hits[0].section_anchor).toBe("Ann3bCommentPrendre");
    expect(body.hits[0].block_id).toBe("document-b98622");
    expect(body.hits[0].quote).toBe("Ne pas dépasser la dose recommandée.");
  });

  it("strips ** bold markers from answer and sub_header", async () => {
    nock(ALBERT_API).post("/v1/chat/completions").reply(200, {
      choices: [{
        message: {
          content: JSON.stringify({
            answer: "**Adultes** : 1 comprimé toutes les 6 heures.",
            section_anchor: "Ann3bCommentPrendre",
            sub_header: "**Adultes et adolescents**",
            block_id: "98622",
            quote: "1 comprimé toutes les 6 heures.",
          }),
        },
      }],
    });

    const res = await GET(makeRequest("Posologie adultes ?"), makeParams(CIS));
    const body = await res.json();

    expect(body.hits[0].answer).toBe("Adultes : 1 comprimé toutes les 6 heures.");
    expect(body.hits[0].sub_header).toBe("Adultes et adolescents");
  });

  it("returns empty hits when Albert API returns a 500", async () => {
    nock(ALBERT_API).post("/v1/chat/completions").reply(500);

    const res = await GET(makeRequest("Quelle est la posologie ?"), makeParams(CIS));
    const body = await res.json();

    expect(body.hits).toEqual([]);
  });

  it("returns empty hits when Albert API is unreachable", async () => {
    nock(ALBERT_API).post("/v1/chat/completions").replyWithError("Connection refused");

    const res = await GET(makeRequest("Quelle est la posologie ?"), makeParams(CIS));
    const body = await res.json();

    expect(body.hits).toEqual([]);
  });

  it("returns 400 when q param is missing", async () => {
    const req = new NextRequest(`http://localhost/medicaments/${CIS}/notice-search`);
    const res = await GET(req, makeParams(CIS));

    expect(res.status).toBe(400);
  });

  it("returns empty hits for an unknown CIS", async () => {
    const res = await GET(makeRequest("test"), makeParams("00000000"));
    const body = await res.json();

    expect(body.hits).toEqual([]);
  });
});
