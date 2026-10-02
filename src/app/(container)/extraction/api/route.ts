import { NextRequest, NextResponse } from "next/server";
import { getMedicamentsExtract } from "@/db/utils/extraction";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const subsIds = Array.isArray(body?.subsIds) ? body.subsIds : [];
  const atc2Codes = Array.isArray(body?.atc2Codes) ? body.atc2Codes : [];
  const fieldKeys = Array.isArray(body?.fieldKeys) ? body.fieldKeys : [];

  const results = await getMedicamentsExtract({ subsIds, atc2Codes }, fieldKeys);
  return NextResponse.json(results);
}
