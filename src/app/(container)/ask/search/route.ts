import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/albert";
import { analyzeQuery } from "./queryAnalysis";
import { detectCISCodes, searchNoticeChunks } from "./noticeSearch";

export type { NoticeChunkHit } from "./noticeSearch";
export type { QueryAnalysis } from "./queryAnalysis";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) return NextResponse.json({ hits: [] });

  try {
    const [vector, analysis] = await Promise.all([
      embed(q.trim()),
      analyzeQuery(q.trim()),
    ]);

    if (!analysis.is_relevant) {
      return NextResponse.json({ hits: [], irrelevant: true });
    }
    if (analysis.is_dangerous) {
      return NextResponse.json({ hits: [], dangerous: true });
    }

    const cisEntries = await detectCISCodes(analysis);
    const hits = await searchNoticeChunks(vector, cisEntries);

    return NextResponse.json({ hits, analysis });
  } catch (err) {
    console.error("[/ask/search]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
