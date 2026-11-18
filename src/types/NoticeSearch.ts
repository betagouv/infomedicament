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
}

export type NoticeSearchResponse =
  | { status: "supported"; sourceVersion: string; passages: NoticePassage[] }
  | { status: "insufficient_evidence" | "unavailable" | "error"; passages: [] };

export type NoticeSearchResult = NoticeSearchResponse | {
  status: "section";
  passages: [];
  sectionAnchor: string;
};
