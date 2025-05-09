import { bulkFetchRangeFromMatomo } from '@/services/matomo';
import { MatomoUniqueVisitorsMetrics } from '@/types/Matomo';
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const results = await bulkFetchRangeFromMatomo<MatomoUniqueVisitorsMetrics>({
    method: 'VisitsSummary.getUniqueVisitors',
    period: 'month',
  });
  return NextResponse.json(results);
};
