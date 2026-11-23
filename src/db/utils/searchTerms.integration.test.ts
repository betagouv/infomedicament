import { afterAll, describe, expect, it } from "vitest";
import { loadEnvConfig } from "@next/env";
import { Kysely, PostgresDialect, sql } from "kysely";
import { Pool } from "pg";
import type { Database, SearchResult } from "@/db/types";
import {
  rowMatchesRequiredTermsPredicate,
  termsSimilarityExpression,
} from "./searchTerms";

loadEnvConfig(process.cwd());
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL ?? process.env.APP_DB_URL,
      connectionTimeoutMillis: 5000,
    }),
  }),
});
afterAll(() => db.destroy());

// Exercise PostgreSQL's real regex/trigram semantics against statement-local
// fixtures. No catalogue data is required or modified.
async function find(query: string, tokens: string[], autocomplete = false) {
  const fixtures = tokens.map((token) => ({ token, match_type: "name" }));
  return db
    .with(
      "search_index",
      () => sql<SearchResult>`(
      select * from jsonb_to_recordset(${JSON.stringify(fixtures)}::jsonb)
      as fixture(token text, match_type text)
    )`,
    )
    .selectFrom("search_index")
    .select("token")
    .select((eb) =>
      termsSimilarityExpression(eb, [query], { autocomplete }).as("sml"),
    )
    .where((eb) =>
      rowMatchesRequiredTermsPredicate(eb, [query], { autocomplete }),
    )
    .orderBy("sml", "desc")
    .execute();
}

describe("normal search term matching (PostgreSQL)", () => {
  it("finds Ventoline 100 and excludes other numeric values", async () => {
    const rows = await find("ventolin 100", [
      "ventoline 100 microgrammes/dose, suspension pour inhalation",
      "ventoline 1000 microgrammes/dose",
      "ventoline 2100 microgrammes/dose",
      "ventoline 100,5 microgrammes/dose",
    ]);
    expect(rows.map((r) => r.token)).toEqual([
      "ventoline 100 microgrammes/dose, suspension pour inhalation",
    ]);
  });

  it("matches short text inside a multi-word name at word boundaries", async () => {
    expect(
      (await find("alpha lp", ["alpha lp comprime", "alpha slp comprime"])).map(
        (r) => r.token,
      ),
    ).toEqual(["alpha lp comprime"]);
    expect(
      (await find("ve", ["ventoline 100", "autre ventoline 100"])).map(
        (r) => r.token,
      ),
    ).toEqual(["ventoline 100"]);
  });

  it("requires every word but permits reordering", async () => {
    expect(
      (
        await find("acide folique", [
          "acide acetylsalicylique",
          "folique acide comprime",
        ])
      ).map((r) => r.token),
    ).toEqual(["folique acide comprime"]);
  });

  it("handles decimals and attached units without converting units", async () => {
    expect(
      (
        await find("alpha 0.5mg", [
          "alpha 0,5 mg comprime",
          "alpha 0.5mg comprime",
          "alpha 0,5 microgrammes",
          "alpha 0,05 mg",
          "alpha 5 mg",
        ])
      )
        .map((r) => r.token)
        .sort(),
    ).toEqual(["alpha 0,5 mg comprime", "alpha 0.5mg comprime"]);
    expect(
      (
        await find("alpha 100 mg", [
          "alpha 100 microgrammes",
          "alpha 1000 mg",
          "alpha 100 ml et 500 mg",
        ])
      ).map((r) => r.token),
    ).toEqual([]);
    expect(await find("alpha 0.1 g", ["alpha 100 mg"])).toEqual([]);
    expect(await find("alpha 0.50 mg", ["alpha 0,5mg"])).toHaveLength(1);
  });

  it("allows only the final numeric term to be unfinished in autocomplete", async () => {
    const tokens = [
      "ventoline 10 microgrammes",
      "ventoline 100 microgrammes",
      "ventoline 210 microgrammes",
    ];
    expect((await find("ventoline 10", tokens)).map((r) => r.token)).toEqual([
      tokens[0],
    ]);
    expect(
      (await find("ventoline 10", tokens, true)).map((r) => r.token),
    ).toEqual(tokens.slice(0, 2));
    expect(await find("10 ventoline", [tokens[1]], true)).toEqual([]);
    expect(await find("ventoline 10 ", [tokens[1]], true)).toEqual([]);
    expect(await find("alpha 100 m", ["alpha 100 mg"], true)).toHaveLength(1);
    expect(await find("alpha 100 m", ["alpha 100mg"], true)).toHaveLength(1);
  });

  it("ranks literal and phrase matches above reordered, prefix and fuzzy matches", async () => {
    const rows = await find("paracetamol arrow", [
      "paracetmol arrow comprime",
      "arrow paracetamol comprime",
      "paracetamol arrow comprime",
    ]);
    expect(rows.map((r) => r.token)).toEqual([
      "paracetamol arrow comprime",
      "arrow paracetamol comprime",
      "paracetmol arrow comprime",
    ]);
    expect(rows.every((r) => r.sml > 0)).toBe(true);
  });

  it("does not discard literal matches because of whole-query similarity", async () => {
    const rows = await find("lp alpha", ["alpha tres longue denomination lp"]);
    expect(rows).toHaveLength(1);
    expect(rows[0].sml).toBeGreaterThanOrEqual(0.55);
  });

  it("keeps long-word typo tolerance and treats SQL/regex metacharacters literally", async () => {
    expect(await find("paracetmol", ["paracetamol"])).toHaveLength(1);
    expect(await find("zz%", ["alpha"])).toEqual([]);
    expect(await find("100", ["1000", "2100", "0,100", "0.100"])).toEqual([]);
    expect(await find("alpha microgrammes", ["alpha microgrammees"])).toEqual(
      [],
    );
    expect(await find("n05ba01", ["n05ba01"])).toHaveLength(1);
    expect(await find("67458236", ["67458236", "167458236"])).toHaveLength(1);
  });
});
