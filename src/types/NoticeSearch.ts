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

export interface NoticeQuote {
  id: string;
  html: string;
  headingPath: string[];
  /** Source fragments represented by this connected quotation. */
  supersedes?: string[];
  /** Half-open positions in this passage; omitted source material creates a gap. */
  sourceRange?: { start: number; end: number };
}

export type NoticeSearchResponse =
  | { status: "supported"; sourceVersion: string; passages: NoticePassage[] }
  | { status: "insufficient_evidence" | "unavailable" | "error"; passages: [] };
