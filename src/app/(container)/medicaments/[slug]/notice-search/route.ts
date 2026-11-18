import { NextRequest, NextResponse } from "next/server";
import { CHAT_MODEL, NOTICE_SELECTION_VERSION, selectNoticePassages } from "@/lib/albert";
import { prepareNoticePassages, resolveNoticeSelection } from "@/lib/noticePassages";
import { getNotice } from "@/db/utils/notice";
import { getIdFromSlug } from "@/utils/slug";
import type { NoticeSearchResponse } from "@/types/NoticeSearch";

async function getCachedSelection(
  contentHtml: string,
  question: string,
  model: string,
  selectionVersion: string,
): Promise<NoticeSearchResponse> {
  "use cache: remote";
  // Arguments include the exact source and selection configuration in the cache key.
  void selectionVersion;
  const { passages, sourceVersion } = prepareNoticePassages(contentHtml);
  if (passages.length === 0) return { status: "unavailable", passages: [] };
  const selection = await selectNoticePassages(passages, question, model);
  const selected = resolveNoticeSelection(passages, selection);
  return selected.length
    ? { status: "supported", sourceVersion, passages: selected }
    : { status: "insufficient_evidence", passages: [] };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const question = req.nextUrl.searchParams.get("q")?.trim();
  if (!question) return NextResponse.json({ error: "Missing q" }, { status: 400 });
  const CIS = getIdFromSlug((await params).slug);
  try {
    const notice = await getNotice(CIS);
    if (!notice?.contentHtml) return NextResponse.json({ status: "unavailable", passages: [] });
    return NextResponse.json(await getCachedSelection(notice.contentHtml, question, CHAT_MODEL, NOTICE_SELECTION_VERSION));
  } catch {
    console.error("[notice-search] Passage selection failed");
    return NextResponse.json({ status: "error", passages: [] }, { status: 502 });
  }
}
