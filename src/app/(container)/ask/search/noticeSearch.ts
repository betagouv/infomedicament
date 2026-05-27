import { getOSConfig, osHeaders } from "@/lib/opensearch";
import type { QueryAnalysis } from "./queryAnalysis";

export interface NoticeChunkHit {
  cis: string;
  spec_name: string;
  section_title: string;
  sub_header: string | null;
  text: string;
  html_snippets: string[];
}

export interface CISEntry {
  cis: string;
  spec_name: string;
}

// TODO: Tune this: scores differ significantly between local (20 docs) and production.
const MIN_SCORE = 10.0;

type Entities = Pick<
  QueryAnalysis,
  "medications" | "substances" | "pathologies" | "atc_classes"
>;

export async function detectCISCodes(entities: Entities): Promise<CISEntry[]> {
  const should = [
    ...entities.medications.map((q) => ({ match: { spec_name: { query: q, boost: 3 } } })),
    ...entities.substances.map((q) => ({ match: { substances: { query: q, boost: 2 } } })),
    ...entities.pathologies.map((q) => ({ match: { pathologies: { query: q, boost: 1 } } })),
    ...entities.atc_classes.map((q) => ({ match: { atc_labels: { query: q, boost: 1 } } })),
  ];

  if (should.length === 0) return [];

  const { baseUrl, authHeader } = getOSConfig();
  const res = await fetch(`${baseUrl}/specialites/_search`, {
    method: "POST",
    headers: osHeaders(authHeader),
    body: JSON.stringify({
      size: 200,
      min_score: MIN_SCORE,
      query: { bool: { should } },
      _source: ["spec_name"],
    }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  const entries = (data.hits.hits as Array<{ _id: string; _source: { spec_name: string } }>).map(
    (h) => ({ cis: h._id, spec_name: h._source.spec_name }),
  );
  console.log("[detectCISCodes]", entries.length, "CIS codes:", entries.map((e) => e.cis));
  return entries;
}

export async function searchNoticeChunks(
  vector: number[],
  cisEntries: CISEntry[],
): Promise<NoticeChunkHit[]> {
  const cisCodes = cisEntries.map((e) => e.cis);
  const specMap = new Map(cisEntries.map((e) => [e.cis, e.spec_name]));
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
      _source: ["cis", "section_title", "sub_header", "text", "html_snippets"],
    }),
  });
  if (!res.ok) throw new Error(`OpenSearch error: ${res.status}`);
  const data = await res.json();
  return (data.hits.hits as Array<{ _source: Omit<NoticeChunkHit, "spec_name"> }>).map((h) => ({
    ...h._source,
    spec_name: specMap.get(h._source.cis) ?? "",
  }));
}
