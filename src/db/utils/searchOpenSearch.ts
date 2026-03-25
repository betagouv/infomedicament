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

export const getOpenSearchResults = unstable_cache(
  async function (query: string): Promise<SearchResultItemV2[]> {
    if (!query?.trim()) return [];

    // 1. Query OpenSearch specialites index
    const response = await getOpenSearchClient().search({
      index: "specialites",
      body: {
        size: 100,
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
