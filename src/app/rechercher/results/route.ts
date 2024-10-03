import { getResults } from "@/db/search";
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
  const results = await getResults(search);
  return NextResponse.json(results.slice(0, 10));
}
