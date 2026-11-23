export interface NoticeSourceTarget {
  anchor?: string;
  blockId?: string;
}

export interface NoticePassage {
  id: string;
  headingPath: string[];
  html: string;
  target: NoticeSourceTarget;
  quotes: NoticeQuote[];
}

export interface NoticeQuoteSource extends NoticeSourceTarget {
  start: number;
  end: number;
}

export interface NoticeQuote {
  id: string;
  html: string;
  headingPath: string[];
  /** Exact original source blocks and decoded-text offsets; never model supplied. */
  sources?: NoticeQuoteSource[];
  target?: NoticeSourceTarget;
  /** Source fragments represented by this connected quotation. */
  supersedes?: string[];
  /** Half-open positions in this passage; omitted source material creates a gap. */
  sourceRange?: { start: number; end: number };
  /** Source identity lets selected bullets share their original introduction. */
  listSource?: {
    id: string;
    itemStart: number;
    itemEnd: number;
    introductionIds: string[];
    introductoryItemHtml?: string;
  };
}

export type NoticeSearchResponse =
  | {
      status: "supported";
      sourceVersion: string;
      passages: NoticePassage[];
    }
  | { status: "insufficient_evidence" | "unavailable" | "error"; passages: [] };
