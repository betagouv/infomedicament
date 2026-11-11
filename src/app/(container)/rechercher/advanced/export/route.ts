import type { NextRequest } from "next/server";
import { getAdvancedSearchExport } from "@/db/utils/advancedSearchExport";
import {
  parseAdvancedSearch,
  hasAdvancedSearchCriteria,
  parseAdvancedResultOptions,
} from "@/utils/advancedSearch";
import { csvLine, searchCsvHeaders } from "@/utils/searchCsv";
import { getProcedureLibLong, getSpecSlug } from "@/utils/specialites";
import { statutAmmToDisplayStatus } from "@/db/utils/specialiteCatalog";
import { commercialStatusToDisplayStatus } from "@/db/utils/presentationCatalog";
import type { AnsmPresentation } from "@/db/types";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  if (!params.has("advanced")) params.set("advanced", "1");
  let criteria, options;
  try {
    criteria = parseAdvancedSearch(params)!;
    if (!hasAdvancedSearchCriteria(criteria))
      throw new Error("Renseignez au moins un critère de recherche.");
    options = parseAdvancedResultOptions(params);
    // UI exports contain only visible form criteria and side filters.
    if (params.get("s"))
      throw new Error(
        "Utilisez les critères du formulaire avancé pour l’export.",
      );
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 400 });
  }
  const rows = await getAdvancedSearchExport(criteria, options);
  const encoder = new TextEncoder();
  let index = -1;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index === -1) {
        controller.enqueue(
          encoder.encode("\uFEFF" + csvLine(searchCsvHeaders)),
        );
        index = 0;
        return;
      }
      // Emit small chunks so the response respects download backpressure.
      const lines = rows
        .slice(index, index + 100)
        .map((row) => {
          const statuses =
            row.marketingStatuses as AnsmPresentation["statut_commercialisation"][];
          const marketing = statuses.includes("COMMERCIALISEE")
            ? "Commercialisée"
            : [...new Set(statuses.map(commercialStatusToDisplayStatus))]
                .sort()
                .join(" / ") || "Non renseignée";
          return csvLine([
            row.cis,
            row.denomination,
            row.substances.join(" | "),
            row.holders.join(" | "),
            row.atcs?.map((a) => a.code).join(" | "),
            row.atcs?.map((a) => a.label).join(" | "),
            getProcedureLibLong(row.procedure ?? "NON_COMMUNIQUEE"),
            statutAmmToDisplayStatus(row.statut_amm),
            row.authorizationDate,
            marketing,
            row.rcpUpdatedAt,
            `${req.nextUrl.origin}/medicaments/${getSpecSlug(row.cis, row.denomination ?? "")}`,
          ]);
        })
        .join("");
      if (lines) controller.enqueue(encoder.encode(lines));
      index += 100;
      if (index >= rows.length) controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="recherche-avancee.csv"',
      "Cache-Control": "no-store",
      "X-Search-Total-Count": String(rows.length),
    },
  });
}
