import { getSearchResults } from "@/db/utils";
import { NextRequest, NextResponse } from "next/server";
import { initialAdvancedCriteria } from "@/utils/advancedSearch";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("s")?.trim() ?? "";
  if (
    searchParams.has("advanced") ||
    Object.keys(initialAdvancedCriteria).some((key) => searchParams.has(key))
  ) {
    return NextResponse.json(
      {
        error:
          "Utilisez /rechercher/advanced/results pour les critères avancés.",
      },
      { status: 400 },
    );
  }
  if (search.length > 200)
    return NextResponse.json(
      { error: "La recherche est limitée à 200 caractères." },
      { status: 400 },
    );
  if (!search) {
    return NextResponse.json(
      { error: "Missing search parameter" },
      { status: 400 },
    );
  }
  const results = await getSearchResults(search);
  return NextResponse.json(results.slice(0, 10));
}
