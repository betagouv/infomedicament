import { searchInteractions } from "@/db/utils/interactions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchInteractions(q);
  return NextResponse.json(results);
}
