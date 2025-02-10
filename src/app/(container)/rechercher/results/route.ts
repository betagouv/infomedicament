import { getSearchResults } from "@/db/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("s");
  if (!search) {
    return NextResponse.json(
      { error: "Missing search parameter" },
      { status: 400 },
    );
  }
  const results = await getSearchResults(search, { onlyDirectMatches: true });
  return NextResponse.json(results.slice(0, 10));
}
