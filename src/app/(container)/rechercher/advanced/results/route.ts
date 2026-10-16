import { NextRequest, NextResponse } from "next/server";
import { getCachedAdvancedSearchResults } from "@/db/utils/advancedSearch";
import {
  MAX_ADVANCED_SEARCH_RESULTS,
  parseAdvancedSearch,
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
  try {
    criteria = parseAdvancedSearch(params)!;
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
  const results = await getCachedAdvancedSearchResults(search, criteria);
  return NextResponse.json(results, {
    headers: { "X-Search-Result-Limit": String(MAX_ADVANCED_SEARCH_RESULTS) },
  });
}
