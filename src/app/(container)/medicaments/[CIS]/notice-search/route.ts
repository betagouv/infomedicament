import { NextRequest, NextResponse } from "next/server";
import { embed } from "@/lib/albert";
import { getOSConfig, osHeaders } from "@/lib/opensearch";

export interface NoticeChunkHit {
  section_anchor: string;
  section_title: string;
  sub_header: string | null;
  text: string;
  html_snippets: string[];
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
    size: 2,
    query: {
      bool: {
        must: { knn: { embedding: { vector, k: 2 } } },
        filter: { term: { cis: CIS } },
      },
    },
    _source: ["cis", "section_anchor", "section_title", "sub_header", "text", "html_snippets"],
  };

  const res = await fetch(`${baseUrl}/notice_chunks/_search`, {
    method: "POST",
    headers: osHeaders(authHeader),
    body: JSON.stringify(body),
  });

  if (!res.ok) return NextResponse.json({ error: "OpenSearch error" }, { status: 502 });

  const data = await res.json();
  const hits: NoticeChunkHit[] = (data.hits?.hits ?? []).map(
    (h: { _source: NoticeChunkHit }) => h._source,
  );

  return NextResponse.json({ hits });
}
