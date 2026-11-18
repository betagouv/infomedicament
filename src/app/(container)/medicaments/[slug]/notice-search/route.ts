import { NextRequest, NextResponse } from "next/server";
import {
  CHAT_MODEL,
  NOTICE_SELECTION_VERSION,
  selectNoticePassages,
} from "@/lib/albert";
import {
  prepareNoticePassages,
  resolveNoticeSelection,
} from "@/lib/noticePassages";
import { getNotice } from "@/db/utils/notice";
import { getIdFromSlug } from "@/utils/slug";
import type { NoticeSearchResponse } from "@/types/NoticeSearch";
import { questionsList } from "@/data/pages/notices_anchors";

async function getCachedSelection(
  contentHtml: string,
  questionId: string,
  model: string,
  selectionVersion: string,
): Promise<NoticeSearchResponse> {
  "use cache: remote";
  // Arguments include the exact source and selection configuration in the cache key.
  void selectionVersion;
  const { passages, sourceVersion } = prepareNoticePassages(contentHtml);
  if (passages.length === 0) return { status: "unavailable", passages: [] };
  const question = questionsList[questionId];
  if (question.headerId) {
    const section = passages.find(
      (passage) => passage.target.anchor === question.headerId,
    );
    if (section) {
      // Composition shares the broad packaging section; use its named subsection
      // when available rather than also quoting manufacturers and addresses.
      const keywords = question.keywords ?? [];
      const answer =
        passages.find(
          (passage) =>
            passage.headingPath.length > section.headingPath.length &&
            section.headingPath.every(
              (heading, index) => passage.headingPath[index] === heading,
            ) &&
            keywords.some((keyword) =>
              (passage.headingPath.at(-1) ?? "")
                .toLocaleLowerCase("fr")
                .startsWith(keyword.toLocaleLowerCase("fr")),
            ),
        ) ?? section;
      return {
        status: "supported",
        sourceVersion,
        passages: [
          {
            ...answer,
            quotes: [
              {
                id: `${answer.id}-section`,
                html: answer.html,
                headingPath: answer.headingPath,
              },
            ],
          },
        ],
      };
    }
  }
  if (!question.queryText)
    return { status: "insufficient_evidence", passages: [] };
  const selection = await selectNoticePassages(
    passages,
    question.queryText,
    model,
  );
  const selected = resolveNoticeSelection(passages, selection);
  return selected.length
    ? { status: "supported", sourceVersion, passages: selected }
    : { status: "insufficient_evidence", passages: [] };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const questionId = req.nextUrl.searchParams.get("question");
  if (!questionId || !Object.hasOwn(questionsList, questionId)) {
    return NextResponse.json(
      { error: "Unknown preset question" },
      { status: 400 },
    );
  }
  const CIS = getIdFromSlug((await params).slug);
  try {
    const notice = await getNotice(CIS);
    if (!notice?.contentHtml)
      return NextResponse.json({ status: "unavailable", passages: [] });
    return NextResponse.json(
      await getCachedSelection(
        notice.contentHtml,
        questionId,
        CHAT_MODEL,
        NOTICE_SELECTION_VERSION,
      ),
    );
  } catch {
    console.error("[notice-search] Passage selection failed");
    return NextResponse.json(
      { status: "error", passages: [] },
      { status: 502 },
    );
  }
}
