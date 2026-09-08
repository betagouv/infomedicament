"use server";

import db from "..";
import { AnsmStock } from "@/types/StockTypes";
import { AnsmStockDB } from "../types";

export async function getStockFromCIS(CIS: string): Promise<AnsmStock[]> {
  const rawStock: AnsmStockDB[] = await db
    .selectFrom("ansm_stock")
    .where("CIS", "=", CIS)
    .selectAll()
    .execute();

  // Agrège les lignes qui ne diffèrent que par le CIP dans un même tableau CIP
  const stocks: AnsmStock[] = [];
  rawStock.forEach((stock) => {
    if(stock.CIP) {
      const index = stocks.findIndex(
        (s) => !s.CIP?.includes(stock.CIS) 
          && s.status_id === stock.status_id
          && s.date_begin?.getTime() === stock.date_begin?.getTime()
          && s.date_end?.getTime() === stock.date_end?.getTime()
          && s.date_update?.getTime() === stock.date_update?.getTime()
          && s.link?.trim() === stock.link?.trim()
      );
      if (index === -1) {
        stocks.push({
          ...stock,
          CIP: [stock.CIP],
        } as AnsmStock);
      } else if (stock.CIP) {
        stocks[index].CIP?.push(stock.CIP);
      }
    } else {
      stocks.push({
        ...stock,
      } as AnsmStock);
    }
  });
  return stocks;
};