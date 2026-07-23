import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { answerNoticeQuestion } from "@/lib/albert";
import { getNotice } from "@/db/utils/notice";

export interface NoticeChunkHit {
  section_anchor: string;
  section_title: string;
  sub_header: string | null;
  answer?: string;
  block_id?: string;
  quote?: string;
}

type LLMResult = { answer: string; section_anchor: string; sub_header: string; block_id: string; quote: string };

const getCachedAnswer = (CIS: string, q: string, noticeText: string) =>
  unstable_cache(
    (): Promise<LLMResult> => answerNoticeQuestion(noticeText, q),
    ["notice-search", CIS, q],
    { revalidate: 60 * 60 * 24 },
  )();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ CIS: string }> },
) {
  const { CIS } = await params;
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  const notice = await getNotice(CIS);
  if (!notice?.contentHtml) return NextResponse.json({ hits: [] });

  let result: LLMResult;
  try {
    result = await getCachedAnswer(CIS, q, notice.contentHtml);
  } catch (err) {
    console.error("[notice-search] LLM error", err);
    return NextResponse.json({ hits: [] });
  }

  if (!result.answer) return NextResponse.json({ hits: [] });

  const stripBold = (s: string) => s.replace(/\*\*/g, '').trim();

  return NextResponse.json({
    hits: [{
      section_anchor: result.section_anchor,
      section_title: "",
      sub_header: result.sub_header ? stripBold(result.sub_header) : null,
      answer: stripBold(result.answer),
      block_id: result.block_id || undefined,
      quote: result.quote || undefined,
    }],
  });
}
