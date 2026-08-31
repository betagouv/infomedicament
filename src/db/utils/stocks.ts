"use server";

import { AnsmStock } from "@/types/StockTypes";
import db from "..";

export async function getStockFromCIS(CIS: string): Promise<AnsmStock[]> {
  const rawStock = await db
    .selectFrom("ansm_stock")
    .where("CIS", "=", CIS)
    .selectAll()
    .execute();

  //Agregate CIP column
  let stocks: AnsmStock[] = [];
  rawStock.forEach((stock) => {
    if(stock.CIP) {
      const index = stocks.findIndex((s) => s.CIP !== stock.CIP && s.status_id === stock.status_id);
      if(index === -1) {
        stocks.push({
          ...stock,
          CIP: [],
        });
      } else {
        stocks[index].CIP?.push(stock.CIP);
      }
    } else {
      stocks.push({
        ...stock,
        CIP: [],
      });
    }
  });
  return stocks;
};