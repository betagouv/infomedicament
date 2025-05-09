import { bulkFetchRangeFromMatomo } from '@/services/matomo';
import { MatomoActionMetrics } from '@/types/Matomo';
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const results = await bulkFetchRangeFromMatomo<MatomoActionMetrics>({
    method: 'Actions.get',
    period: 'month',
  });
  return NextResponse.json(results);
};
