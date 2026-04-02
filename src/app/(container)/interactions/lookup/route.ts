import { lookupInteractions } from "@/db/utils/interactions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const subst_ids_1: string[] = body.subst_ids_1 ?? [];
  const subst_ids_2: string[] = body.subst_ids_2 ?? [];
  const results = await lookupInteractions(subst_ids_1, subst_ids_2);
  return NextResponse.json(results);
}
