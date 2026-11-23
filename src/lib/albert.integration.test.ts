import { readFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import nock from "nock";
import { expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { questionsList } from "@/data/pages/notices_anchors";
import { selectNoticePassages } from "./albert";
import {
  prepareNoticePassages,
  resolveNoticeSelection,
} from "./noticePassages";

// Opt in with ALBERT_LIVE_TEST=1; normal tests never call the external API.
it.runIf(process.env.ALBERT_LIVE_TEST === "1")(
  "selects the CIS 64793681 alcohol warning for the combined alcohol/food question in one call",
  async () => {
    loadEnvConfig(process.cwd());
    if (!process.env.ALBERT_API_KEY)
      throw new Error("ALBERT_API_KEY is required");
    const { passages } = prepareNoticePassages(
      readFileSync("src/testsUtils/fixtures/notice-64793681.html", "utf8"),
    );
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    nock.enableNetConnect("albert.api.etalab.gouv.fr");
    try {
      const answer = await selectNoticePassages(
        passages,
        questionsList.boireManger.queryText!,
      );
      const quotes = resolveNoticeSelection(passages, answer)
        .flatMap((passage) => passage.quotes)
        .map((quote) => quote.html)
        .join("\n");
      expect(answer.status).toBe("supported");
      expect(quotes).toContain(
        "la consommation de boissons alcoolisées pendant le traitement est déconseillée.",
      );
      expect(quotes).toContain(
        "En cas de sevrage récent d’un alcoolisme chronique, le risque d’atteinte hépatique est majoré.",
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      fetchSpy.mockRestore();
      nock.disableNetConnect();
    }
  },
  60_000,
);
