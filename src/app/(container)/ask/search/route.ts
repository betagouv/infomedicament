import { NextRequest, NextResponse } from "next/server";

export interface NoticeChunkHit {
  cis: string;
  section_title: string;
  sub_header: string | null;
  text: string;
}

// Tune this: scores differ significantly between local (20 docs) and production.
// Start low locally, raise in production once you see real score distributions.
const MIN_MEDICATION_SCORE = 10.0;

// Node.js fetch rejects URLs with embedded credentials — extract them into a
// Basic Auth header instead.
function getOSConfig(): { baseUrl: string; authHeader: string | null } {
  const raw =
    process.env.SCALINGO_OPENSEARCH_URL ||
    process.env.OPENSEARCH_URL ||
    "http://localhost:9200";
  const url = new URL(raw);
  let authHeader: string | null = null;
  if (url.username || url.password) {
    const encoded = Buffer.from(
      `${decodeURIComponent(url.username)}:${decodeURIComponent(url.password)}`,
    ).toString("base64");
    authHeader = `Basic ${encoded}`;
    url.username = "";
    url.password = "";
  }
  return { baseUrl: url.toString().replace(/\/$/, ""), authHeader };
}

function osHeaders(authHeader: string | null): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;
  return headers;
}

async function embedQuery(query: string): Promise<number[]> {
  const res = await fetch("https://albert.api.etalab.gouv.fr/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.ALBERT_API_KEY}`,
    },
    body: JSON.stringify({ model: "BAAI/bge-m3", input: query }),
  });
  if (!res.ok) {
    throw new Error(`Albert API error: ${res.status}`);
  }
  const data = await res.json();
  return data.data[0].embedding as number[];
}

// Returns CIS codes for any medication detected in the query.
// Uses the specialites index (spec_name + substances, French analyzer).
// Returns [] if no medication is detected — no filter will be applied.
async function detectMedicationCIS(query: string): Promise<string[]> {
  const { baseUrl, authHeader } = getOSConfig();
  const res = await fetch(`${baseUrl}/specialites/_search`, {
    method: "POST",
    headers: osHeaders(authHeader),
    body: JSON.stringify({
      size: 10,
      min_score: MIN_MEDICATION_SCORE,
      query: {
        multi_match: {
          query,
          fields: ["spec_name^3", "substances"],
        },
      },
      _source: false,
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.hits.hits as Array<{ _id: string }>).map((h) => h._id);
}

async function searchNoticeChunks(
  vector: number[],
  cisCodes: string[],
): Promise<NoticeChunkHit[]> {
  // NMSLIB doesn't support the filter param inside the knn clause.
  // Workaround: wrap in bool.must + bool.filter (post-filter).
  // Increase k when filtering so enough candidates survive the post-filter.
  const filtering = cisCodes.length > 0;
  const knnClause = { vector, k: filtering ? 50 : 5 };
  const query = filtering
    ? {
        bool: {
          must: { knn: { embedding: knnClause } },
          filter: { terms: { cis: cisCodes } },
        },
      }
    : { knn: { embedding: knnClause } };

  const { baseUrl, authHeader } = getOSConfig();
  const res = await fetch(`${baseUrl}/notice_chunks/_search`, {
    method: "POST",
    headers: osHeaders(authHeader),
    body: JSON.stringify({
      size: 5,
      query,
      _source: ["cis", "section_title", "sub_header", "text"],
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenSearch error: ${res.status}`);
  }
  const data = await res.json();
  return (data.hits.hits as Array<{ _source: NoticeChunkHit }>).map(
    (h) => h._source,
  );
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ hits: [] });
  }
  try {
    const [vector, cisCodes] = await Promise.all([
      embedQuery(q.trim()),
      detectMedicationCIS(q.trim()),
    ]);
    const hits = await searchNoticeChunks(vector, cisCodes);
    return NextResponse.json({ hits, detectedCIS: cisCodes });
  } catch (err) {
    console.error("[/ask/search]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
