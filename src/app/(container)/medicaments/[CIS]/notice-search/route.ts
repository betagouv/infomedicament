import { NextRequest, NextResponse } from "next/server";
import { cacheLife } from "next/cache";
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

type LLMResult = {
  answer: string;
  section_anchor: string;
  sub_header: string;
  block_id: string;
  quote: string;
};

async function getCachedAnswer(
  CIS: string,
  q: string,
): Promise<LLMResult | undefined> {
  "use cache: remote";
  cacheLife("daily");

  const notice = await getNotice(CIS);
  if (!notice?.contentHtml) return undefined;

  return answerNoticeQuestion(notice.contentHtml, q);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ CIS: string }> },
) {
  const { CIS } = await params;
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });

  let result: LLMResult | undefined;
  try {
    result = await getCachedAnswer(CIS, q.trim());
  } catch (err) {
    console.error("[notice-search] LLM error", err);
    return NextResponse.json({ hits: [] });
  }

  if (!result?.answer) return NextResponse.json({ hits: [] });

  const stripBold = (s: string) => s.replace(/\*\*/g, "").trim();

  return NextResponse.json({
    hits: [
      {
        section_anchor: result.section_anchor,
        section_title: "",
        sub_header: result.sub_header ? stripBold(result.sub_header) : null,
        answer: stripBold(result.answer),
        block_id: result.block_id || undefined,
        quote: result.quote || undefined,
      },
    ],
  });
}
