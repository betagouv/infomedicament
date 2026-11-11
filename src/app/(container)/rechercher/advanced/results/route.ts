import { NextRequest, NextResponse } from "next/server";
import {
  getCachedAdvancedSearchResults,
  getCachedAdvancedSearchPage,
} from "@/db/utils/advancedSearch";
import {
  MAX_ADVANCED_SEARCH_RESULTS,
  ADVANCED_PAGE_SIZE,
  parseAdvancedResultOptions,
  parseAdvancedSearch,
  hasAdvancedSearchCriteria,
} from "@/utils/advancedSearch";

export async function GET(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  const search = params.get("s")?.trim() ?? "";
  if (search.length > 200)
    return NextResponse.json(
      { error: "La recherche est limitée à 200 caractères." },
      { status: 400 },
    );
  // The endpoint selects advanced mode; clients need not pass a mode flag.
  if (!params.has("advanced")) params.set("advanced", "1");
  let criteria;
  let options;
  try {
    criteria = parseAdvancedSearch(params)!;
    options = parseAdvancedResultOptions(params);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
  if (!search && !hasAdvancedSearchCriteria(criteria))
    return NextResponse.json([], { headers: { "X-Search-Total-Count": "0" } });
  if (
    ["page", "order", "filterSubstance", "filterAtc", "filterIndication"].some(
      (key) => params.has(key),
    )
  ) {
    const data = await getCachedAdvancedSearchPage(search, criteria, options);
    return NextResponse.json(data.results, {
      headers: {
        "X-Search-Result-Limit": String(ADVANCED_PAGE_SIZE),
        "X-Search-Total-Count": String(data.total),
        "X-Search-Page": String(data.page),
      },
    });
  }
  const results = await getCachedAdvancedSearchResults(search, criteria);
  return NextResponse.json(results, {
    headers: { "X-Search-Result-Limit": String(MAX_ADVANCED_SEARCH_RESULTS) },
  });
}
