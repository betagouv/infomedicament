import { describe, it, expect } from "vitest";

import { getStockFromCIS } from "./stocks";

describe("getStockFromCIS", () => {
  it("returns a stock without CIP", async () => {
    //ALEPSAL 150 mg, comprimé
    const stocks = await getStockFromCIS("66014762");

    expect(stocks).toHaveLength(1);
    expect(stocks[0]).toMatchObject({
      CIS: "66014762",
      CIP: null,
      status_id: 2,
      status: "Tension d'approvisionnement",
    });
  });

  it("returns a stock with an array of CIPs", async () => {
    //IOMERON 400 (400 mg Iode/mL), solution injectable
    const stocks = await getStockFromCIS("60495132");

    expect(stocks).toHaveLength(1);
    expect(stocks[0].CIP).toEqual(
      expect.arrayContaining([
        "3400930282267",
        "3400933795146",
        "3400933795375",
        "3400933795665",
      ]),
    );
    expect(stocks[0].CIP).toHaveLength(4);
  });

  it("returns an array of stocks for the same CIS", async () => {
    //BEFIZAL L.P. 400 mg, comprimé enrobé à libération prolongée
    const stocks = await getStockFromCIS("62119207");

    expect(stocks).toHaveLength(2);
    expect(stocks.map((s) => s.status_id).sort()).toEqual([2, 4]);
  });

  it("returns no stock", async () => {
    //FAMOTIDINE EG 20 mg, comprimé pelliculé
    const stocks = await getStockFromCIS("60005856");

    expect(stocks).toEqual([]);
  });
});
