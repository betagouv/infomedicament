import { lookupInteractions } from "@/db/utils/interactions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const substIds1: string[] = body.substIds1 ?? [];
  const classIds1: string[] = body.classIds1 ?? [];
  const substIds2: string[] = body.substIds2 ?? [];
  const classIds2: string[] = body.classIds2 ?? [];
  const results = await lookupInteractions(substIds1, classIds1, substIds2, classIds2);
  return NextResponse.json(results);
}
