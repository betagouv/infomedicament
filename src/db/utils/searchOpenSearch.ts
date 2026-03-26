"use server";

import "server-cli-only";
import { Client } from "@opensearch-project/opensearch";
import db from "@/db";
import { sql } from "kysely";
import { unstable_cache } from "next/cache";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { getResumeSpecsGroupsAlerts } from "@/data/grist/specialites";
import { formatSpecialitesResumeFromGroups } from "@/utils/specialites";
import { SpecialiteAlerts } from "@/types/SpecialiteTypes";
import { IntentMapping } from "@/db/utils/searchIntent";

export type SearchResultItemV2 = {
  cisCode: string;
  specName: string;
  StatutBdm: string;
  ProcId: string;
  isSurveillanceRenforcee: boolean;
  composants: string;
  atc1Label?: string;
  atc2Label?: string;
  alerts?: SpecialiteAlerts;
};

let openSearchClient: Client | null = null;

function getOpenSearchClient(): Client {
  if (!openSearchClient) {
    const node =
      process.env.SCALINGO_OPENSEARCH_URL ||
      process.env.OPENSEARCH_URL ||
      process.env.OPENSEARCH_HOST ||
      "http://localhost:9200";
    openSearchClient = new Client({ node, ssl: { rejectUnauthorized: false } });
  }
  return openSearchClient;
}

export type SearchSectionResult = {
  cisCode: string;
  specName: string;
  docType: "notice" | "rcp";
  sectionAnchor: string;
  sectionTitle: string;
  highlights: string[]; // HTML snippets with <mark class="highlight">...</mark>
};

export const getOpenSearchSectionResults = unstable_cache(
  async function (query: string, cisCodes: string[], intent?: IntentMapping): Promise<SearchSectionResult[]> {
    if (!query?.trim() || !cisCodes.length) return [];

    const filters: object[] = [{ terms: { cis_code: cisCodes } }];
    if (intent?.anchorId) {
      filters.push({ term: { section_anchor: intent.anchorId } });
    }

    const should = intent && !intent.anchorId
      ? [{ match: { section_title: { query: intent.sectionTitleQuery, boost: 5 } } }]
      : undefined;

    const response = await getOpenSearchClient().search({
      index: "specialite_sections",
      body: {
        size: 10,
        query: {
          bool: {
            // When anchorId is set, the filter already pinpoints the exact section —
            // no need for full-text scoring, so use match_all.
            must: intent?.anchorId
              ? { match_all: {} }
              : { multi_match: { query, fields: ["section_title^2", "text_content"] } },
            filter: filters,
            ...(should ? { should, minimum_should_match: 0 } : {}),
          },
        },
        highlight: {
          fields: {
            text_content: {
              pre_tags: ['<mark class="highlight">'],
              post_tags: ["</mark>"],
              fragment_size: 200,
              number_of_fragments: 3,
            },
          },
        },
      },
    });

    const hits: Array<{
      _source: {
        cis_code: string;
        spec_name: string;
        doc_type: string;
        section_anchor: string;
        section_title: string;
      };
      highlight?: { text_content?: string[] };
    }> = response.body.hits?.hits ?? [];

    const results = hits.map((h) => ({
      cisCode: h._source.cis_code,
      specName: h._source.spec_name,
      docType: h._source.doc_type as "notice" | "rcp",
      sectionAnchor: h._source.section_anchor,
      sectionTitle: h._source.section_title,
      highlights: h.highlight?.text_content ?? [],
    }));
    console.log(`[getOpenSearchSectionResults] query="${query}" intent=${intent ? `{sectionTitleQuery="${intent.sectionTitleQuery}"${intent.anchorId ? ` anchorId="${intent.anchorId}"` : ""}}` : "none"} → ${results.length} results: ${results.map((r) => `"${r.specName} / ${r.sectionTitle}"`).join(", ") || "(none)"}`);
    return results;
  },
  ["opensearch-section-results"],
  { revalidate: 3600 },
);

export const getOpenSearchResults = unstable_cache(
  async function (query: string): Promise<SearchResultItemV2[]> {
    if (!query?.trim()) return [];

    // 1. Query OpenSearch specialites index
    const response = await getOpenSearchClient().search({
      index: "specialites",
      body: {
        size: 10,
        query: {
          multi_match: {
            query,
            fields: ["spec_name^4", "substances^3", "atc_labels^2", "pathologies^1"],
          },
        },
      },
    });

    const hits: Array<{ _id: string }> = response.body.hits?.hits ?? [];
    if (!hits.length) return [];

    const cisCodes = hits.map((h) => h._id);

    // 2. Fetch groups from resume_medicaments for all returned CIS codes
    const rawGroups = await db
      .selectFrom("resume_medicaments")
      .where(
        sql<boolean>`"CISList" && ARRAY[${sql.join(cisCodes.map((c) => sql.val(c)))}]::text[]`,
      )
      .selectAll()
      .execute();

    if (!rawGroups.length) return [];

    // 3. Enrich with ATC labels and alerts (reusing existing enrichment pipeline)
    const formatted = formatSpecialitesResumeFromGroups(rawGroups);
    const withATC = await getResumeSpecsGroupsATCLabels(formatted);
    const withAlerts = await getResumeSpecsGroupsAlerts(withATC);

    // 4. Build CIS → result lookup from enriched groups
    const cisToResult = new Map<string, SearchResultItemV2>();
    for (const group of withAlerts) {
      for (const spec of group.resumeSpecialites) {
        cisToResult.set(spec.SpecId, {
          cisCode: spec.SpecId,
          specName: spec.SpecDenom01,
          StatutBdm: spec.StatutBdm,
          ProcId: spec.ProcId,
          isSurveillanceRenforcee: spec.isSurveillanceRenforcee,
          composants: group.composants,
          atc1Label: group.atc1Label,
          atc2Label: group.atc2Label,
          alerts: spec.alerts,
        });
      }
    }

    // Return in OpenSearch relevance order, skipping any CIS not found in DB
    return cisCodes.flatMap((cis) => {
      const result = cisToResult.get(cis);
      return result ? [result] : [];
    });
  },
  ["opensearch-results"],
  { revalidate: 3600 },
);
