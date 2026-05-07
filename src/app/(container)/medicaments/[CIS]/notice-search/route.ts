import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/albert";
import { getOSConfig, osHeaders } from "@/lib/opensearch";

export interface NoticeChunkHit {
  section_anchor: string;
  section_title: string;
  sub_header: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ CIS: string }> },
) {
  const { CIS } = await params;
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const vector = await embed(q);
  const { baseUrl, authHeader } = getOSConfig();

  const body = {
    size: 1,
    query: {
      bool: {
        must: { knn: { embedding: { vector, k: 1 } } },
        filter: { term: { cis: CIS } },
      },
    },
    _source: ["section_anchor", "section_title", "sub_header"],
  };

  const res = await fetch(`${baseUrl}/notice_chunks/_search`, {
    method: "POST",
    headers: osHeaders(authHeader),
    body: JSON.stringify(body),
  });

  if (!res.ok) return NextResponse.json({ error: "OpenSearch error" }, { status: 502 });

  const MIN_SCORE = 0.5;
  const data = await res.json();
  const hits: NoticeChunkHit[] = (data.hits?.hits ?? [])
    .filter((h: { _score: number }) => h._score >= MIN_SCORE)
    .map((h: { _source: NoticeChunkHit }) => h._source);

  return NextResponse.json({ hits });
}
